# PeerServ
Facilitates general secure peer-to-peer message exchanges between parties.
## What Is This?

TODO

### Ok, what is this *REALLY*?

TODO

## Spinning Up

Clone the repo with Docker installed.

TODO

Run `docker compose up`
- Your API will run on port **3001**
- Your database will be available on port **3002**
  - Username: `root`
  - Password: `test`
  <!-- - Database: `bytes` -->
- A web SQL database viewer (PHPMyAdmin) is on port **3003**

To interact with this API, spin up a copy of the [PeerServ UI](https://github.com/p2ppsr/peerserv-ui) in parallel with this system.

## Deploying

You can see some brief guidance on [deploying this server with Google Cloud Run](DEPLOYING.md).

## License

The license for the code in this repository is the Open BSV License.
