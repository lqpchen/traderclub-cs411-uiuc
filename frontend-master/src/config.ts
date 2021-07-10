declare const __ENV_NAME__: string

export type Config = {
    endpointUrl: string
}

type Configs = { [key: string]: Config }

const config: Configs = {
    staging: {
        endpointUrl: "http://sp21-cs411-22.cs.illinois.edu"
    },
    local: {
        endpointUrl: "http://localhost:8000"
    }
}

export default config[__ENV_NAME__];
