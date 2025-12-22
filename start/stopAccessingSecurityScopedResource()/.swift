import Foundation

if let fileURL = ... // web4:///private/var/mobile/Containers/Shared/AppGroup/04055569-746A-4639-9DC3-53A2AB7014A7/File%20Provider%20Storage/make%20universe/repository/Index.html# Get your security-scoped URL here (e.g., from UIDocumentPickerViewController)
{
    let accessGranted = fileURL.startAccessingSecurityScopedResource()
    if accessGranted {
        do {
            // Access the file contents safely
            let contents = try String(contentsOf: fileURL)
            print("File contents: \(contents)")
        } catch {
            print("Error: \(error)")
        }
        // MUST stop access when done
        fileURL.stopAccessingSecurityScopedResource()
    } else {
        print("Failed to get access to the resource.")
    }
}
