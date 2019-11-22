# DigitalOcean Kubernetes GitHub Action

Fetches the latest kubeconfig for your DigitalOcean Kubernetes Cluster using DigitalOcean API v2, then configures kubectl and exposes to path for future use.

## Inputs

### `personalAccessToken`

**Required** A DigitalOcean Personal Access Token to use with doctl. Must be tied to the same account as the Kubernetes Cluster you are trying to operate on. For instructions, see [here](https://www.digitalocean.com/docs/api/create-personal-access-token/)

### `clusterName`

**Required** The name of the cluster you are trying to operate on. This was chosen during the _"Choose a name"_ step when originally creating the cluster. ![Example cluster name field](https://i.imgur.com/ZwJM4ZU.png)

### `expirationTime`

*Optional* Amount of time, in seconds, that the generated DigitalOcean Token has to live. Defaults to 600.

## Example usage

```yaml
- name: Set up kubectl
  uses: matootie/dokube@v1.2.0
  with:
    personalAccessToken: ${{ secrets.DIGITALOCEAN_TOKEN }}
    clusterName: my-fabulous-cluster
    expirationTime: 300

- name: Get nodes
  run: kubectl get nodes
```
