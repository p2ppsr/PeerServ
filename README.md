# PeerServ
Facilitates general secure peer-to-peer message exchanges between parties.

## Environmental Variables

You can pass `ENV=prod`, `ENV=staging` or `ENV=dev` depending the enviornment.

The following can also be configured:
- `SERVER_PRIVATE_KEY` - the server's private key for authentication
- `MIGRATE_KEY` - the key used to run the latest migration
- `HOSTING_DOMAIN` - the server's hosting domain

## Scripts

- `build` — build the API documentation
- `start` — start the server without any debugging services
- `dev` — start the server with debugging capabilities
- `test` — run all available tests

## Spinning Up

Clone the repo with Docker installed.

Generate a `SERVER_PRIVATE_KEY` (64 random hex digits, 256-bits) and put it into the `docker-compose.yml` file. This is the key that will be used by authrite for mutual authentication.

Run `docker compose up`
- Your API will run on port **3002**
- Your database will be available on port **3001**
  - Username: `root`
  - Password: `test`
  - Database: `peerserv`
- A web SQL database viewer (PHPMyAdmin) is on port **3003**

To interact with this API, spin up a copy of the [PeerServ-Tokenator Demo UI](https://github.com/p2ppsr/peerserv-tokenator-demo) in parallel with this system.

## Deploying

You can see some brief guidance on [deploying this server with Google Cloud Run](DEPLOYING.md).

## License

The license for the code in this repository is the Open BSV License.
