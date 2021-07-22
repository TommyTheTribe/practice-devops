terraform {
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "1.16.0"
    }
  }
}

provider "scaleway" {
  zone   = "fr-par-1"
  region = "fr-par"
}

module "kubernetes" {
  source           = "nlamirault/kapsule/scaleway"
  version          = "0.2.0"
  name             = "my-kapsule"
  description      = "Kubernetes on Kapsule"
  k8s_version      = "1.20.5"
  cni              = "cilium"
  enable_dashboard = true
  ingress          = "nginx"
  node_pools = {
    "default" = {
      "node_type"           = "DEV1_M"
      "size"                = 1
      "min_size"            = 1
      "max_size"            = 1
      "autoscaling"         = true
      "autohealing"         = true
      "wait_for_pool_ready" = true
    }
  }
}

resource "local_file" "kubeconfig" {
  content  = module.kubernetes.kubeconfig[0].config_file
  filename = "${path.module}/../kubeconfig.yaml"
}
