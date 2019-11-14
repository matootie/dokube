# DigitalOcean Kubernetes GitHub Action
> dokube

Fetches the latest kubeconfig for your DigitalOcean Kubernetes Cluster using doctl, then configures kubectl and exposes to path for future use.

## Inputs

### `personalAccessToken`

**Required** A DigitalOcean Personal Access Token to use with doctl. Must be tied to the same account as the Kubernetes Cluster you are trying to operate on. For instructions, see [here](https://www.digitalocean.com/docs/api/create-personal-access-token/)

### `clusterName`

**Required** The name of the cluster you are trying to operate on. This was chosen during the _"Choose a name"_ step when originally creating the cluster. ![](https://i.imgur.com/ZwJM4ZU.png)

## Example usage

```yaml
- name: Set up kubectl
  uses: uniappca/dokube@v1.0.0
  with:
    personalAccessToken: ${{ secrets.DIGITALOCEAN_TOKEN }}
    clusterName: my-fabulous-cluster
    expirationTime: 700

- name: Get nodes
  run: kubectl get nodes
```
