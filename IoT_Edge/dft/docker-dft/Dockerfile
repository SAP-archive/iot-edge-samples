FROM alpine:3.13.1
RUN echo "http://dl-cdn.alpinelinux.org/alpine/latest-stable/main" > /etc/apk/repositories
RUN echo "http://dl-cdn.alpinelinux.org/alpine/latest-stable/community" >> /etc/apk/repositories
RUN apk update
RUN apk --no-cache --update-cache add automake gcc g++ gfortran subversion python3 python3-dev py3-pip build-base wget freetype-dev libpng-dev openblas-dev tesseract-ocr python3 py3-numpy
RUN ln -s /usr/include/locale.h /usr/include/xlocale.h
RUN pip3 install --upgrade pip setuptools wheel

RUN pip3 install numpy

RUN pip3 install scipy
RUN pip3 install flask

COPY dft.py .
CMD python3 dft.py
