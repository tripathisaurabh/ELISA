import qrcode


def generate_qr(data: str, file_path: str):
    img = qrcode.make(data)
    img.save(file_path)
    return file_path
