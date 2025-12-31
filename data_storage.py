import Foundation

// Make sure Transcript model exists (id: UUID, text, language, date, gptSummary optional)
final class TranscriptStorage {
    static let shared = TranscriptStorage()
    private init() {
        cache = loadFromDisk()
    }

    private let filename = "transcripts.json"
    private var cache: [Transcript] = []

    private var fileURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(filename)
    }

    // MARK: - Public API

    func load() -> [Transcript] {
        return cache
    }

    /// Save locally immediately; optionally create embedding + upsert vector + upload to CloudKit asynchronously.
    /// - Parameters:
    ///   - t: transcript to save
    ///   - useEmbeddings: if true, will call EmbeddingsService to generate and persist vector
    ///   - cloudSync: if true, will upload to CloudKit private DB
    func save(_ t: Transcript, useEmbeddings: Bool = true, cloudSync: Bool = true) {
        // persist locally immediately
        var list = load()
        list.append(t)
        cache = list
        persist() // write disk in background

        // async: create embedding & upsert vector
        if useEmbeddings {
            EmbeddingsService.shared.createEmbedding(text: t.text) { result in
                switch result {
                case .success(let vec):
                    VectorStore.shared.upsert(id: t.id, vector: vec)
                case .failure(let err):
                    print("[NeuraLog] embedding failed:", err.localizedDescription)
                }
            }
        }

        // async: cloud sync
        if cloudSync {
            CloudKitSync.shared.upload(t) { res in
                switch res {
                case .success(): break
                case .failure(let err): print("[NeuraLog] Cloud upload failed:", err.localizedDescription)
                }
            }
        }
    }

    func overwrite(_ list: [Transcript]) {
        cache = list
        persist()
    }

    func delete(id: UUID) {
        cache.removeAll { $0.id == id }
        persist()
        VectorStore.shared.remove(id: id)
        CloudKitSync.shared.delete(id) { _ in /* ignore errors for now */ }
    }

    func deleteAll() {
        cache.removeAll()
        persist()
        VectorStore.shared.clearAll()
        // Cloud delete of all is optional and dangerous; skip by default.
    }

    func search(_ q: String) -> [Transcript] {
        guard !q.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return cache }
        let s = q.lowercased()
        return cache.filter {
            $0.text.lowercased().contains(s) ||
            ($0.gptSummary ?? "").lowercased().contains(s) ||
            ($0.gptTags ?? []).joined(separator: " ").lowercased().contains(s)
        }
    }

    // MARK: - Persistence

    private func persist() {
        DispatchQueue.global(qos: .background).async {
            do {
                let data = try JSONEncoder().encode(self.cache)
                try data.write(to: self.fileURL, options: .atomic)
            } catch {
                print("[NeuraLog] persist error:", error.localizedDescription)
            }
        }
    }

    private func loadFromDisk() -> [Transcript] {
        guard let data = try? Data(contentsOf: fileURL) else { return [] }
        return (try? JSONDecoder().decode([Transcript].self, from: data)) ?? []
    }
}