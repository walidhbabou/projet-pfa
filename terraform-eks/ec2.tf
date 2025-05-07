data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "ubuntu_1804" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*"]
  }
}

resource "aws_instance" "jenkins" {
  key_name      = "devops-key"
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t2.micro"

  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.kubernetes.id]
  associate_public_ip_address = true

  tags = {
    Name        = "${var.project_name}-jenkins"
    Environment = var.environment
  }
}

resource "aws_instance" "masterVM" {
  ami                         = data.aws_ami.ubuntu_1804.id
  instance_type               = "t3.medium"
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.kubernetes.id]
  associate_public_ip_address = true
  key_name                    = "devops-key"

  root_block_device {
    volume_type = "gp2"
    volume_size = 30
  }

  tags = {
    Name        = "masterVM"
    Role        = "master"
    Environment = var.environment
  }
}

resource "aws_instance" "worker1VM" {
  ami                         = data.aws_ami.ubuntu_1804.id
  instance_type               = "t3.small"
  subnet_id                   = aws_subnet.public[1].id
  vpc_security_group_ids      = [aws_security_group.kubernetes.id]
  associate_public_ip_address = true
  key_name                    = "devops-key"

  root_block_device {
    volume_type = "gp2"
    volume_size = 30
  }

  tags = {
    Name        = "worker1VM"
    Role        = "worker"
    Environment = var.environment
  }
}
