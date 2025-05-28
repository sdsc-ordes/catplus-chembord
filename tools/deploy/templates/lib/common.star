load("@ytt:data", "data")

def s3_secret_name():
  if data.values.s3.existingSecret:
    return data.values.s3.existingSecret
  else:
    return data.values.name + "-secrets"