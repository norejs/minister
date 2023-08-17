module.exports = function rollupConfig(config, options) {
    try {
        const external = config.input.external;
        config.input.external = id => {
            return id.indexOf("@minister") > -1 || external(id);
        };
    } catch (error) {}

    return config;
};
