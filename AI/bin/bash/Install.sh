# Remove existing virtual environment if necessary
rm -rf env/
python -m venv env
source env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
npm install --save-dev gh-pages
