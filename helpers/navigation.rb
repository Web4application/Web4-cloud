TOC = %w(
  codebase dependencies config backing-services build-release-run
  processes port-binding concurrency disposability dev-prod-parity
  logs admin-processes
)

def prev_factor(f)
  i = TOC.index(f)
  i && i > 0 ? TOC[i - 1] : nil
end

def next_factor(f)
  i = TOC.index(f)
  i && i < TOC.size - 1 ? TOC[i + 1] : nil
end
