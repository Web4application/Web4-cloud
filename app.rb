require 'sinatra'
require_relative 'config/settings'
require_relative 'config/i18n'
require_relative 'config/security'

Dir['helpers/*.rb'].each { |f| require_relative f }
Dir['routes/*.rb'].each  { |f| require_relative f }

enable :sessions

not_found { 'Page not found' }
