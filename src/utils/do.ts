/**
 * DigitalOcean API utilities.
 */

// External imports.
import axios from "axios"

// Utility imports.
import { DO_BASE_URL } from "@utils/constants"

/**
 * The DigitalOcean Kubernetes Cluster type.
 */
interface DOKubernetesCluster {
  name: string
  id: string
  region: string
  [key: string]: any
}

/**
 * The DigitalOcean Kubernetes Cluster Credentials type.
 */
interface DOKubernetesClusterCredentials {
  server: string
  certificate_authority_data: string
  token: string
}

/**
 * List clusters.
 */
interface ListClustersInput {
  accessToken: string
}
export async function listClusters({
  accessToken,
}: ListClustersInput): Promise<DOKubernetesCluster[]> {
  console.log("Listing all clusters...")
  // Request the API.
  const { data } = await axios({
    baseURL: DO_BASE_URL,
    url: "/kubernetes/clusters",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  // Return the clusters.
  return (data.kubernetes_clusters as DOKubernetesCluster[]) || []
}

/**
 * Get cluster by name.
 */
interface GetClusterByNameInput {
  clusterName: string
  accessToken: string
}
export async function getClusterByName({
  clusterName,
  accessToken,
}: GetClusterByNameInput): Promise<DOKubernetesCluster | undefined> {
  // List the clusters.
  const clusters = await listClusters({ accessToken })
  // Find the cluster by name.
  console.log("Finding cluster by name...")
  const cluster = clusters.find((c) => c.name === clusterName)
  // Return the cluster.
  return cluster
}

/**
 * Get cluster credentials.
 */
interface GetClusterCredentialsInput {
  cluster: DOKubernetesCluster
  accessToken: string
  expirationTime: string
}
export async function getClusterCredentials({
  cluster,
  accessToken,
  expirationTime,
}: GetClusterCredentialsInput): Promise<DOKubernetesClusterCredentials> {
  console.log("Getting cluster credentials...")
  // Get cluster credentials.
  const { data: credentials } = await axios({
    baseURL: DO_BASE_URL,
    url: `/kubernetes/clusters/${cluster.id}/credentials`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      expiry_seconds: expirationTime,
    },
  })
  // Return the credentials.
  return credentials as DOKubernetesClusterCredentials
}
