# DigitalOcean Kubernetes GitHub Action

Fetches the config for your DigitalOcean Kubernetes Cluster, then installs and configures `kubectl`, exposing it to path for future use!

**Disclaimer:** As of late, I haven't been using much Kubernetes in my daily projects. I've been focusing more on developing with serverless functions. Because of this, I haven't been making use of this GitHub Action either, so I haven't been able to find any bugs or feature ideas. Consider this project relatively unmaintained. That is to say, if you _do_ make use of it and would like to submit and Issue outlining a problem you're facing, or a feature you want to implement, I will definitely be around to address those. Thank you.

[![GitHub Release](https://img.shields.io/github/v/release/matootie/dokube)](https://github.com/matootie/dokube/releases/latest)

For help updating, view the [change logs](https://github.com/matootie/dokube/releases).

## Runs on

| Type                | Systems                                                                                                   | Note                                                                                       |
| :------------------ | :-------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| GitHub Runners      | `ubuntu-18.04`, `ubuntu-20.04`, `macos-10.15`, `macos-11`, `windows-2016`, `windows-2019`, `windows-2022` | _All available GitHub hosted runners._                                                     |
| Self-Hosted Runners | `linux-amd64`, `linux-arm64`, `linux-s390x`, `macOS-x64`, `windows-x64`                                   | _Not tested, but in theory should work as long as `kubectl` is available for your system._ |

## Inputs

| Name                  | Requirement    | Description                                                                                                                                                                                                                                                                                                            |
| :-------------------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `personalAccessToken` | **Required**   | A DigitalOcean Personal Access Token to use for authentication, when fetching cluster credentials from DigitalOcean. Must be tied to the same account as the Kubernetes Cluster you are trying to operate on. For instructions, see [here](https://docs.digitalocean.com/reference/api/create-personal-access-token/). |
| `clusterName`         | **Required**   | The name of the cluster you are trying to operate on. This was chosen during the _"Choose a name"_ step when originally creating the cluster.                                                                                                                                                                          |
| `version`             | **_Optional_** | The kubectl version to use. Remember to omit "v" prefix, for example: `1.16.0`. Defaults to `1.16.0`. _See [example](#specifying-a-specific-kubectl-version) below_.                                                                                                                                                   |
| `expirationTime`      | **_Optional_** | Amount of time, in seconds, that the generated DigitalOcean Token has to live. Typically should be slightly longer than the amount of time your job will run. Defaults to 600. _See [example](#specifying-a-custom-expiration-time) below_.                                                                            |
| `namespace`           | **_Optional_** | The Kubernetes namespace to operate under. Defaults to `default`.                                                                                                                                                                                                                                                      |

## Example usage

#### Simple, minimal usage...

```yaml
- name: Set up kubectl
  uses: matootie/dokube@v1.3.4
  with:
    personalAccessToken: ${{ secrets.DIGITALOCEAN_TOKEN }}
    clusterName: my-fabulous-cluster

- name: Get nodes
  run: kubectl get nodes
```

This will setup `kubectl` configured with your DigitalOcean Kubernetes cluster. After that you're free to use `kubectl` as you wish!

#### Specifying a specific kubectl version...

```yaml
- name: Set up kubectl
  uses: matootie/dokube@v1.3.4
  with:
    personalAccessToken: ${{ secrets.DIGITALOCEAN_TOKEN }}
    clusterName: my-fabulous-cluster
    version: "1.17.4"

- name: Get nodes
  run: kubectl get nodes
```

If you would like to install a specific version of `kubectl`, you can specify it with the `version` input.

#### Specifying a custom expiration time...

```yaml
- name: Set up kubectl
  uses: matootie/dokube@v1.3.4
  with:
    personalAccessToken: ${{ secrets.DIGITALOCEAN_TOKEN }}
    clusterName: my-fabulous-cluster
    expirationTime: "1200"

- name: Get nodes
  run: kubectl get nodes
```

The generated Kubernetes config is set to only last a short amount of time, as it is only expected to be used for the duration of the job. If you would like to specify a shorter or larger time, better tailored to the average length of your job, you can do so with the `expirationTime` input.
