def canonical_url
  uri = URI(request.url)
  uri.query = nil
  uri.to_s
end

def alternate_links
  I18n.available_locales.map do |l|
    href = l == I18n.default_locale ? request.path : "/#{l}#{request.path}"
    %(<link rel="alternate" hreflang="#{l}" href="#{href}">)
  end.join("\n")
end
