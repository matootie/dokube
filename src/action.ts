/**
 * Main action runner.
 */

// Standard imports.
import { chmodSync, writeFileSync } from "fs"

// Actions imports.
import core from "@actions/core"
import io from "@actions/io"
import tc from "@actions/tool-cache"

// Utility imports.
import { constructKubeconfig, kubectlSpec } from "@utils/kubectl"
import { WORKDIR } from "@utils/constants"
import { getClusterByName, getClusterCredentials } from "@utils/do"

/**
 * Main runner.
 */
export async function run() {
  try {
    // Create the working directory.
    await io.mkdirP(WORKDIR)

    // Get user input.
    const accessToken = core.getInput("personalAccessToken", { required: true })
    const clusterName = core.getInput("clusterName", { required: true })
    const expirationTime = core.getInput("expirationTime", { required: true })
    const namespaceName = core.getInput("namespace", { required: true })
    const kubectlVersion = core.getInput("version", { required: true })

    // Get the cluster by name.
    const cluster = await getClusterByName({
      clusterName,
      accessToken,
    })
    // Throw if no cluster could be found.
    if (!cluster) {
      throw new Error(`No cluster found with name '${clusterName}'.`)
    }

    // Get cluster credentials.
    const credentials = await getClusterCredentials({
      cluster,
      accessToken,
      expirationTime,
    })

    // Construct a Kubernetes CLI config.
    const kubeconfig = constructKubeconfig({
      auth: credentials.certificate_authority_data,
      server: credentials.server,
      name: cluster.name,
      region: cluster.region,
      namespace: namespaceName,
      token: credentials.token,
    })

    // Save the Kubernetes CLI config.
    writeFileSync(`${WORKDIR}/kubeconfig`, JSON.stringify(kubeconfig, null, 2))

    // Set KUBECONFIG environment variable.
    core.exportVariable("KUBECONFIG", `${WORKDIR}/kubeconfig`)

    // Download and install Kubernetes CLI.
    const spec = kubectlSpec(kubectlVersion)
    let kubectlDirectory = tc.find("kubectl", kubectlVersion, spec.architecture)
    if (!kubectlDirectory) {
      const kubectl = await tc.downloadTool(spec.url)
      chmodSync(kubectl, 0o777)
      kubectlDirectory = await tc.cacheFile(
        kubectl,
        spec.executable,
        "kubectl",
        kubectlVersion,
        spec.architecture,
      )
    }

    // Add Kubernetes CLI to PATH.
    core.addPath(kubectlDirectory)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}
