const fs = require('fs');
const process = require('process');
const request = require('request-promise-native');
const core = require('@actions/core');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');

async function run() {
  try {
    /*

    Required Data:
      - Personal Access Token
      - Cluster Name

    Data to Retrieve
      - Cluster ID
        - From list of clusters
      - Region
        - From list of clusters
      - Certificate Authority Data
        - From cluster credentials
      - Token
        - From cluster credentials

    1. Request list of clusters, using Personal Access Token.
    2. Filter cluster by cluster name.
    3. Request cluster credentials using newly retrieved cluster ID.
    4. Construct kubeconfig.
    5. Save kubeconfig.
    6. Download and install kubectl.
    7. Cache kubeconfig and kubectl.
    8. Set KUBECONFIG environment variable.
    9. Add kubectl to PATH.

    */

    // Set working constants.
    const DOBaseUrl = 'https://api.digitalocean.com';
    const workdir = `${process.env['HOME']}/dokubetemp`;
    await io.mkdirP(workdir);

    // Grab user input.
    const accessToken = core.getInput('personalAccessToken', { required: true });
    const clusterName = core.getInput('clusterName', { required: true });
    const expirationTime = core.getInput('expirationTime', { required: true });
    const namespaceName = core.getInput('namespace', { required: true });
    const kubectlVersion = core.getInput('version', { required: true });

    // Request list of clusters and retrieve cluster ID and region.
    const listClustersOptions = {
      baseUrl: DOBaseUrl,
      uri: '/v2/kubernetes/clusters',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      json: true
    };
    const clusters = await request(listClustersOptions);
    const cluster = clusters['kubernetes_clusters'].find(c => c.name === clusterName);
    if (!cluster) throw new Error(`No cluster found with name: '${clusterName}'`);
    const clusterID = cluster['id'];
    const region = cluster['region'];

    // Get cluster credentials.
    const getCredentialsOptions = {
      baseUrl: DOBaseUrl,
      uri: `/v2/kubernetes/clusters/${clusterID}/credentials`,
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      qs: {
        expiry_seconds: expirationTime
      },
      json: true
    };
    const credentials = await request(getCredentialsOptions);
    const server = credentials['server']
    const certAuthData = credentials['certificate_authority_data'];
    const kubeconfigToken = credentials['token'];

    // Construct a kubeconfig object.
    const fullName = `do-${region}-${clusterName}`;
    const kubeconfig = {
      apiVersion: 'v1',
      clusters: [
        {
          cluster: {
            'certificate-authority-data': certAuthData,
            server: server,
          },
          name: fullName
        }
      ],
      contexts: [
        {
          context: {
            cluster: fullName,
            namespace: namespaceName,
            user: `${fullName}-admin`
          },
          name: fullName
        }
      ],
      'current-context': fullName,
      kind: 'Config',
      preferences: {},
      users: [
        {
          name: `${fullName}-admin`,
          user: {
            token: kubeconfigToken
          }
        }
      ]
    };

    // Save the kubeconfig object.
    const formattedConfig = JSON.stringify(kubeconfig, null, 4);
    fs.writeFileSync(`${workdir}/kubeconfig`, formattedConfig);

    // Download and install kubectl.
    const kubectl = await tc.downloadTool(`https://storage.googleapis.com/kubernetes-release/release/v${kubectlVersion}/bin/linux/amd64/kubectl`);
    await io.mv(kubectl, `${workdir}/kubectl`);

    // Cache kubectl and kubeconfig.
    const cachedPath = await tc.cacheDir(workdir, 'kubectl', `v${kubectlVersion}`);

    // Set KUBECONFIG environment variable.
    core.exportVariable('KUBECONFIG', `${cachedPath}/kubeconfig`);

    // Add kubectl to PATH.
    core.addPath(`${cachedPath}/kubectl`);
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
