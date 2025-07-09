import React from 'react';
import {ChakraProvider, extendTheme} from '@chakra-ui/react';
import ConfigEditor from './components/ConfigEditor';

const theme = extendTheme({
    config: {
        initialColorMode: 'light',
        useSystemColorMode: true,
    },
});

function App() {
    return (
        <ChakraProvider theme={theme}>
            <ConfigEditor/>
        </ChakraProvider>
    );
}

export default App;