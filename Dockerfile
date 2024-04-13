FROM python:3.11-alpine
WORKDIR /usr/src/app
COPY requirements.txt .
RUN apk update
RUN apk add pkgconfig
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]