<script src="https://gist.github.com/stschulte/69fd6612aa7d85da28e985f35e6fc816.js"></script>
The following command creates a random password
with 29 characters:

    LC_ALL=C tr -cd '[:alnum:]' < /dev/urandom|fold -w 29 |head -1

To include special characters:

    LC_ALL=C tr -cd '[:graph:]' < /dev/urandom|fold -w 29 |head -1
