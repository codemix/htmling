FROM malera/es6:dev

### CHANGE HERE YOUR USER ID TO DEVELOPMENT
ENV PERM_USER_ID 1000

### CREATE USER FOR DEVELOPMENT
RUN echo "%sudo ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
    useradd -u ${PERM_USER_ID} -G users,www-data,sudo -d /htmling --shell /bin/bash -m htmling && \
    echo "secret\nsecret" | passwd htmling

### IMPORT FILES TO ENVIRONMENT
COPY ./.bashrc /htmling/.bashrc
COPY ./entrypoint.sh /etc/entrypoint.sh
RUN chmod +x /etc/entrypoint.sh
RUN chown htmling:htmling /htmling/.bashrc

USER htmling
WORKDIR /htmling

CMD ["/bin/bash"]
ENTRYPOINT ["/etc/entrypoint.sh"]
