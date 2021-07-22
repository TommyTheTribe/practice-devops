terraform {
  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = "2.0.0"
    }
  }
}

provider "scaleway" {
  zone   = "fr-par-1"
  region = "fr-par"
}

resource "scaleway_rdb_instance" "main" {
  name           = "practice-rdb"
  node_type      = "DB-DEV-S"
  engine         = "PostgreSQL-11"
  is_ha_cluster  = true
  disable_backup = true
  user_name      = "practice"
  password       = "Practicepracti1@"
}
