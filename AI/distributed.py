from __future__ import annotations
import os
import math
from contextlib import contextmanager
from functools import partial
import torch
from torch import nn, LongTensor
from torch.utils.data import DataLoader
from fastcore.foundation import patch, store_attr, attrgetter, delegates
from fastai.callback.core import Callback
from fastai.learner import Learner
from fastai.data.load import DataLoaders, TfmdDL, _FakeLoader
from fastai.optimizer import OptimWrapper
from fastai.callback.progress import ProgressCallback
from accelerate import Accelerator
from torch.optim.lr_scheduler import ReduceLROnPlateau
import wandb

# Web4AI Imports
from web4ai.task_manager import TaskManager
from web4ai.config import ConfigLoader
from web4ai.logger import Web4AILogger

__all__ = [
    'ParallelTrainer', 'setup_distrib', 'teardown_distrib', 
    'DistributedDL', 'DistributedTrainer', 'rank0_first',
    'train_with_checkpointing', 'init_web4ai_task'
]

# ==== Helper Functions ==== #

def _round_to_multiple(number, multiple):
    return int(math.ceil(number / multiple) * multiple)

def init_web4ai_task(task_name):
    """Initialize a Web4AI task and get the task ID."""
    task_manager = TaskManager()
    task_id = task_manager.start_task(task_name)
    return task_manager, task_id

# ==== Data Parallel Trainer ==== #

@patch
def reset(self: nn.DataParallel):
    if hasattr(self.module, 'reset'):
        self.module.reset()

class ParallelTrainer(Callback):
    run_after, run_before = ProgressCallback, None
    
    def __init__(self, device_ids): 
        self.device_ids = device_ids
    
    def before_fit(self):
        self.learn.model = nn.DataParallel(self.learn.model, device_ids=self.device_ids)
    
    def after_fit(self):
        self.learn.model = self.learn.model.module

@patch
def to_parallel(self: Learner, device_ids=None):
    self.add_cb(ParallelTrainer(device_ids))
    return self

@patch
def detach_parallel(self: Learner):
    self.remove_cb(ParallelTrainer)
    return self

# ==== Distributed Data Loader ==== #

class DistributedDL(TfmdDL):
    def __init__(self, dl, rank=None, world_size=None, device=None):
        if rank is None: rank = rank_distrib()
        if world_size is None: world_size = num_distrib()
        store_attr()

    def _broadcast(self, t, rank):
        t = LongTensor(t).cuda()
        torch.distributed.broadcast(t, rank)
        return t.cpu().tolist()

    def get_idxs(self):
        idxs = list(self.dl.get_idxs())
        idxs = self._broadcast(idxs, 0)
        self.n = len(idxs)
        self.n_padded = _round_to_multiple(self.n, self.world_size)
        idxs += (idxs * (self.n_padded // self.n))[:self.n_padded - self.n]
        return idxs[self.rank * self.n_padded // self.world_size : (self.rank + 1) * self.n_padded // self.world_size]

# ==== Distributed Trainer with Web4AI Hooks ==== #

class DistributedTrainer(Callback):
    order = 11
    
    @delegates(Accelerator)
    def __init__(self, sync_bn=True, task_name="Distributed Training", **kwargs):
        store_attr()
        self.task_manager, self.task_id = init_web4ai_task(task_name)
        self.logger = Web4AILogger(task_id=self.task_id)
        self.accelerator = Accelerator(**kwargs)
        self.config = ConfigLoader()

    def before_fit(self):
        self.learn.model = self.accelerator.prepare(
            nn.SyncBatchNorm.convert_sync_batchnorm(self.learn.model) if self.sync_bn else self.learn.model
        )
        self.scheduler = ReduceLROnPlateau(self.learn.opt, patience=5, factor=0.5, verbose=True)
        self.logger.log("Training started")

    def after_batch(self):
        self.logger.log(f"Batch Loss: {self.learn.loss.item()}")

    def after_epoch(self):
        checkpoint_path = f"./checkpoints/model_epoch_{self.learn.epoch}.pt"
        torch.save(self.learn.model.state_dict(), checkpoint_path)
        self.scheduler.step(self.learn.loss.item())
        self.logger.log(f"Checkpoint saved at {checkpoint_path}")

    def after_fit(self):
        self.logger.log("Training completed")
        self.task_manager.complete_task(self.task_id)

@patch
@delegates(Accelerator)
def to_distributed(self: Learner, sync_bn=True, task_name="Distributed Training", **kwargs):
    self.add_cb(DistributedTrainer(sync_bn, task_name, **kwargs))
    if rank_distrib(): self.remove_cb(ProgressCallback())
    return self

@patch
def detach_distributed(self: Learner):
    if num_distrib() <= 1: return self
    self.remove_cb(DistributedTrainer)
    if rank_distrib(): self.add_cb(ProgressCallback())
    return self

# ==== Web4AI-Enabled Training Loop ==== #

def train_with_checkpointing(learner, epochs, task_name="Training with Checkpointing", checkpoint_dir="./checkpoints"):
    os.makedirs(checkpoint_dir, exist_ok=True)
    task_manager, task_id = init_web4ai_task(task_name)
    logger = Web4AILogger(task_id=task_id)
    start_epoch = 0
    checkpoint_path = os.path.join(checkpoint_dir, "last_checkpoint.pt")

    if os.path.exists(checkpoint_path):
        checkpoint = torch.load(checkpoint_path)
        learner.model.load_state_dict(checkpoint['model_state'])
        learner.opt.load_state_dict(checkpoint['optimizer_state'])
        start_epoch = checkpoint['epoch']
        logger.log(f"Resuming from checkpoint at epoch {start_epoch}")

    for epoch in range(start_epoch, epochs):
        try:
            learner.fit_one_cycle(1)
            torch.save({
                'epoch': epoch + 1,
                'model_state': learner.model.state_dict(),
                'optimizer_state': learner.opt.state_dict(),
            }, checkpoint_path)
            logger.log(f"Checkpoint saved at epoch {epoch + 1}")
        except KeyboardInterrupt:
            logger.log("Training interrupted. Saving checkpoint...")
            torch.save({
                'epoch': epoch,
                'model_state': learner.model.state_dict(),
                'optimizer_state': learner.opt.state_dict(),
            }, checkpoint_path)
            break

    logger.log("Training completed")
    task_manager.complete_task(task_id)

# ==== Utilities ==== #

def setup_distrib(gpu=None):
    if gpu is None: return gpu
    torch.cuda.set_device(gpu)
    torch.distributed.init_process_group(backend='nccl', init_method='env://')

def teardown_distrib():
    if torch.distributed.is_initialized():
        torch.distributed.destroy_process_group()

def rank_distrib():
    return torch.distributed.get_rank() if torch.distributed.is_initialized() else 0

def num_distrib():
    return torch.distributed.get_world_size() if torch.distributed.is_initialized() else 1

def rank0_first(func, *args, **kwargs):
    if args or kwargs: func = partial(func, *args, **kwargs)
    dummy_l = Learner(DataLoaders(device='cpu'), nn.Linear(1,1), loss_func=lambda: 0)
    with dummy_l.distrib_ctx():
        if not rank_distrib(): res = func()
        torch.distributed.barrier()
        if rank_distrib(): res = func()
    return res
