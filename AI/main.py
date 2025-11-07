# main.py
# EDQ-BRAIN: New network + new weights + quantum-inspired entropy
# Requirements: torch, (optional) qiskit
# Install: pip install torch qiskit
import os
import sys
import math
import random
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import serial
import torch
import numpy as np
from ai.ann_model import ANNModel
from ai.snn_model import ReflexSNN
from sensors.lidar_reader import get_sensor_vector
from sensors.camera_reader import read_camera
from swarm.mqtt_comm import publish_state
# --- optional quantum simulator (qiskit). fallback to software RNG ---
use_qiskit = False
try:
    from qiskit import QuantumCircuit, Aer, execute
    use_qiskit = True
except Exception:
    use_qiskit = False

def quantum_entropy_scalar(bits=2):
    """
    Returns a float ~ (0.0, 1.0] derived from quantum measurement if qiskit is available.
    Otherwise returns a pseudo-random float from Python's RNG.
    """
    if use_qiskit:
        # small Hadamard circuit -> measure -> convert counts to a scalar
        qc = QuantumCircuit(bits, bits)
        for i in range(bits):
            qc.h(i)
        qc.measure(range(bits), range(bits))
        backend = Aer.get_backend("qasm_simulator")
        result = execute(qc, backend, shots=256).result()
        counts = result.get_counts()
        # compute a normalized entropy-like scalar
        total = sum(counts.values())
        probs = [v/total for v in counts.values()]
        entropy = -sum(p * math.log(max(p,1e-12), 2) for p in probs)
        # normalize entropy to (0.5, 1.0] roughly
        return 0.5 + (entropy / bits) * 0.5
    else:
        # fallback: deterministic but random-seeded scalar
        return 0.75 + (random.random() * 0.5)

# --- device ---
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ------------------------------
# 1) Define brand-new network
# ------------------------------
class EDQNumeric(nn.Module):
    """Numeric branch (new structure, new weights)"""
    def __init__(self, input_dim=16, hidden_dims=(128, 64)):
        super().__init__()
        self.l1 = nn.Linear(input_dim, hidden_dims[0])
        self.l2 = nn.Linear(hidden_dims[0], hidden_dims[1])
        # custom initializer: Xavier uniform for weights, small constant for bias
        for layer in (self.l1, self.l2):
            nn.init.xavier_uniform_(layer.weight)
            nn.init.constant_(layer.bias, 0.0)

    def forward(self, x):
        x = F.gelu(self.l1(x))
        x = F.gelu(self.l2(x))
        return x  # shape: (batch, hidden_dims[1])

class BrainText(nn.Module):
    """Text branch (small transformer-ish encoder from scratch)"""
    def __init__(self, vocab_size, embed_dim=64, nhead=4, nhid=128, nlayers=1, seq_len=32):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        encoder_layer = nn.TransformerEncoderLayer(d_model=embed_dim, nhead=nhead, dim_feedforward=nhid, activation='gelu')
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=nlayers)
        self.pool = nn.Linear(embed_dim, embed_dim)
        # initialize new weights
        nn.init.xavier_uniform_(self.pool.weight)
        nn.init.zeros_(self.pool.bias)

    def forward(self, x):
        # x: (batch, seq_len)
        emb = self.embed(x) * math.sqrt(self.embed.embedding_dim)  # (batch, seq_len, embed_dim)
        # transformer expects (seq_len, batch, embed_dim)
        t_in = emb.permute(1, 0, 2)
        t_out = self.transformer(t_in)  # (seq_len, batch, embed_dim)
        # mean-pool
        pooled = t_out.mean(dim=0)  # (batch, embed_dim)
        return F.gelu(self.pool(pooled))

class FusionEDQBrain(nn.Module):
    """Fusion network combining both branches + quantum modulation"""
    def __init__(self, vocab_size, numeric_dim=16, seq_len=32, out_dim=16):
        super().__init__()
        self.numeric = EDQNumeric(input_dim=numeric_dim, hidden_dims=(128,64))
        self.brain = BrainText(vocab_size=vocab_size, embed_dim=64, nhead=4, nhid=256, nlayers=1, seq_len=seq_len)
        # fusion layers
        fused_dim = 64 + 64  # numeric branch returns 64, text branch returns 64
        self.fuse1 = nn.Linear(fused_dim, 128)
        self.fuse2 = nn.Linear(128, out_dim)
        for l in (self.fuse1, self.fuse2):
            nn.init.kaiming_normal_(l.weight, nonlinearity='relu')
            nn.init.zeros_(l.bias)

    def forward(self, numeric_x, text_x):
        n_feat = self.numeric(numeric_x)    # (batch,64)
        t_feat = self.brain(text_x)         # (batch,64)
        q = quantum_entropy_scalar(bits=2)  # scalar float
        # apply quantum modulation: scale numeric features and add small noise
        n_mod = n_feat * float(q)
        fused = torch.cat([n_mod, t_feat], dim=1)
        x = F.relu(self.fuse1(fused))
        x = self.fuse2(x)
        return x

# ------------------------------
# 2) Synthetic data loader
# ------------------------------
def synthetic_dataset(n_samples=1024, numeric_dim=16, seq_len=32, vocab_size=2000):
    # numeric tensors: random normal
    X_num = torch.randn(n_samples, numeric_dim)
    # text tensors: random integers in [1, vocab_size-1], 0 reserved for padding
    X_txt = torch.randint(1, vocab_size, (n_samples, seq_len))
    # targets: regression-style or classification labels
    Y = torch.randn(n_samples, 16)  # match out_dim
    return X_num, X_txt, Y

# ------------------------------
# 3) Training routine
# ------------------------------
def train_loop(model, X_num, X_txt, Y, epochs=30, batch_size=32, lr=1e-3):
    model.to(DEVICE)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()
    n = X_num.size(0)
    indices = list(range(n))
    for epoch in range(1, epochs+1):
        random.shuffle(indices)
        epoch_loss = 0.0
        model.train()
        for i in range(0, n, batch_size):
            batch_idx = indices[i:i+batch_size]
            xb_num = X_num[batch_idx].to(DEVICE)
            xb_txt = X_txt[batch_idx].to(DEVICE)
            yb = Y[batch_idx].to(DEVICE)
            optimizer.zero_grad()
            out = model(xb_num, xb_txt)
            loss = loss_fn(out, yb)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item() * xb_num.size(0)
        epoch_loss /= n
        print(f"Epoch {epoch:03d} | Loss: {epoch_loss:.6f} | Device: {DEVICE} | Qiskit: {use_qiskit}")
    return model

# ------------------------------
# 4) Entrypoint
# ------------------------------
def main():
    random.seed(42)
    torch.manual_seed(42)
    # params
    VOCAB_SIZE = 3000
    SEQ_LEN = 32
    NUMERIC_DIM = 16
    OUT_DIM = 16
    SAMPLES = 1024

    # data
    X_num, X_txt, Y = synthetic_dataset(n_samples=SAMPLES, numeric_dim=NUMERIC_DIM, seq_len=SEQ_LEN, vocab_size=VOCAB_SIZE)

    # model
    model = FusionEDQBrain(vocab_size=VOCAB_SIZE, numeric_dim=NUMERIC_DIM, seq_len=SEQ_LEN, out_dim=OUT_DIM)

    # train
    model = train_loop(model, X_num, X_txt, Y, epochs=30, batch_size=32, lr=1e-3)

    # save weights and model summary
    os.makedirs("saved_models", exist_ok=True)
    torch.save({
        "model_state": model.state_dict(),
        "vocab_size": VOCAB_SIZE,
        "seq_len": SEQ_LEN,
        "numeric_dim": NUMERIC_DIM
    }, "saved_models/EDQ_Brain_Quantum_weights.pth")
    print("Saved weights -> saved_models/EDQ_Brain_Quantum_weights.pth")

    # quick inference test
    model.eval()
    with torch.no_grad():
        s_num = torch.randn(1, NUMERIC_DIM).to(DEVICE)
        s_txt = torch.randint(1, VOCAB_SIZE, (1, SEQ_LEN)).to(DEVICE)
        out = model(s_num, s_txt)
        print("Sample output shape:", out.shape)
        print("Sample output (first row):", out.cpu().numpy()[0][:8])

if __name__ == "__main__":
    main()

# Serial to Arduino
ser = serial.Serial('/dev/ttyUSB0', 115200)
actions = ["FORWARD", "LEFT", "RIGHT", "STOP"]

# Initialize models
ann_model = ANNModel()
snn_model = ReflexSNN()
optimizer = torch.optim.Adam(ann_model.parameters(), lr=0.001)
criterion = torch.nn.MSELoss()

try:
    while True:
        # Sensor vector
        sensor_vec = torch.tensor([get_sensor_vector()])
        
        # ANN decision
        ann_output = ann_model(sensor_vec)
        action_idx = torch.argmax(ann_output).item()
        action = actions[action_idx]
        
        # SNN reflex
        reflex_output = snn_model(sensor_vec).detach().numpy()
        
        # Send action to Arduino
        ser.write((action + "\n").encode())
        
        # Reward & learning
        reward = 1 if sensor_vec[0, -1] > 0.1 else -1
        target = torch.zeros_like(ann_output)
        target[0, action_idx] = reward
        optimizer.zero_grad()
        loss = criterion(ann_output, target)
        loss.backward()
        optimizer.step()
        
        # Swarm update
        position = [0,0,0]  # Replace with odometry
        publish_state(position, sensor_vec[0, :-1].tolist())
        
        print(f"Action: {action}, Reward: {reward}, Reflex: {reflex_output}")

except KeyboardInterrupt:
    print("Shutting down Neurobot")
    ser.close()


brain = NeurobotBrain()
optimizer = optim.Adam(brain.parameters(), lr=0.001)
criterion = nn.MSELoss()

# Camera setup
cap = cv2.VideoCapture(0)

try:
    while True:
        # ----- Read Sensors -----
        if ser.in_waiting:
            data = ser.readline().decode().strip()
            if data:
                distance, imu = map(float, data.split(','))  # Arduino sends "distance,imu_angle"
                sensor_input = torch.tensor([[distance, imu]], dtype=torch.float32)
        
        # ----- Read Camera -----
        ret, frame = cap.read()
        if not ret:
            continue
        image_input = preprocess_camera(frame)
        
        # ----- ANN Decision -----
        action = choose_action(brain, image_input, sensor_input)
        ser.write((action + "\n").encode())
        
        # ----- Reward & Training -----
        reward = compute_reward(distance)
        target = torch.zeros(1, 3)
        target[0, actions.index(action)] = reward
        
        optimizer.zero_grad()
        output = brain(image_input, sensor_input)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        
        print(f"Distance: {distance:.1f} | IMU: {imu:.1f} | Action: {action} | Reward: {reward}")

except KeyboardInterrupt:
    print("Stopping Neurobot brain...")
    cap.release()
    ser.close()
    
