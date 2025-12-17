require 'maruku'

def render_markdown(file)
  Maruku.new(
    File.read("content/#{I18n.locale}/#{file}.md", encoding: 'utf-8')
  ).to_html
end

def render_post(file)
  Maruku.new(
    File.read("blog/#{file}.md", encoding: 'utf-8')
  ).to_html
end
