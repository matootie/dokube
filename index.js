const fs = require("fs");
const request = require("request-promise-native");
const core = require("@actions/core");
const io = require("@actions/io");
const tc = require("@actions/tool-cache");
const { kubectlSpec } = require("./utils");

async function run() {
  try {
    // Set working constants.
    const DOBaseUrl = "https://api.digitalocean.com";
    const workdir = `${process.env.HOME}/dokubetemp`;
    await io.mkdirP(workdir);

    // Grab user input.
    const accessToken = core.getInput("personalAccessToken");
    const clusterName = core.getInput("clusterName");
    const expirationTime = core.getInput("expirationTime");
    const namespaceName = core.getInput("namespace");
    const kubectlVersion = core.getInput("version");

    // Request list of clusters and retrieve cluster ID and region.
    const listClustersOptions = {
      baseUrl: DOBaseUrl,
      uri: "/v2/kubernetes/clusters",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      json: true
    };
    const clusters = await request(listClustersOptions);
    const cluster = clusters.kubernetes_clusters.find(c => c.name === clusterName);
    if (!cluster) throw new Error(`No cluster found with name: "${clusterName}"`);
    const clusterID = cluster.id;
    const region = cluster.region;

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
    const server = credentials.server;
    const certAuthData = credentials.certificate_authority_data;
    const kubeconfigToken = credentials.token;

    // Construct a kubeconfig object.
    const fullName = `do-${region}-${clusterName}`;
    const kubeconfig = {
      apiVersion: "v1",
      clusters: [
        {
          cluster: {
            "certificate-authority-data": certAuthData,
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
      "current-context": fullName,
      kind: "Config",
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

    // Set KUBECONFIG environment variable.
    core.exportVariable("KUBECONFIG", `${workdir}/kubeconfig`);

    // Download and install kubectl.
    const spec = kubectlSpec(kubectlVersion);
    const kubectlDirectory = tc.find(
      "kubectl",
      kubectlVersion,
      spec.architecture);
    if (!kubectlDirectory) {
      const kubectl = await tc.downloadTool(spec.url);
      const kubectlDirectory = await tc.cacheFile(
        kubectl,
        spec.executable,
        "kubectl",
        kubectlVersion,
        spec.architecture
      );
    }
    core.addPath(kubectlDirectory);
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
