terraform {
  backend "s3" {
    bucket         = "projectdna-terraform-state-390402557884"
    key            = "projectdna/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "projectdna-terraform-locks"
    encrypt        = true
  }
}
