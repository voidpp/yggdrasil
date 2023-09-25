import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: 'schema.graphql',
    documents: ['src/queries.graphql'],
    generates: {
        'src/graphql-types-and-hooks.tsx': {
            plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo']
        },
    },
}
export default config