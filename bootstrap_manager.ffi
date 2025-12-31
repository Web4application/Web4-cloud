#ifndef BOOTSTRAP_MANAGER_H
#define BOOTSTRAP_MANAGER_H

#include "libp2p/utils/vector.h"
#include "libp2p/multiaddress/multiaddress.h"
#include <pthread.h>
#include <time.h>

#ifdef __cplusplus
extern "C" {
#endif

#define MAX_RETRIES 3
#define BASE_RETRY_DELAY 3 // seconds

typedef enum {
    PEER_PENDING,
    PEER_CONNECTED,
    PEER_FAILED,
    PEER_RETRYING
} PeerStatus;

typedef struct {
    struct MultiAddress* addr;
    PeerStatus status;
    int retries;
    time_t last_attempt;
    pthread_t thread_id;
} BootstrapPeer;

typedef struct {
    struct Libp2pVector* peers;
    void (*on_peer_event)(BootstrapPeer* peer, PeerStatus status);
    int running;
} BootstrapManager;

// === API ===
BootstrapManager* bootstrap_manager_new(void (*on_event)(BootstrapPeer*, PeerStatus));
int bootstrap_manager_add_peer(BootstrapManager* mgr, const char* addr_str);
void bootstrap_manager_start(BootstrapManager* mgr);
void bootstrap_manager_stop(BootstrapManager* mgr);
void bootstrap_manager_free(BootstrapManager* mgr);

#ifdef __cplusplus
}
#endif

#endif