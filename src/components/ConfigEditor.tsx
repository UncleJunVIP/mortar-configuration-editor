import {
    AddIcon,
    ArrowUpIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CopyIcon,
    DeleteIcon,
    DownloadIcon,
    EditIcon,
    MoonIcon,
    SunIcon,
} from '@chakra-ui/icons';
import {
    Badge,
    Box,
    Button,
    ButtonGroup,
    Card,
    CardBody,
    CardHeader,
    Container,
    Divider,
    Flex,
    Heading,
    HStack,
    IconButton,
    Input,
    Spacer,
    Text,
    useColorMode,
    useColorModeValue,
    useToast,
    VStack,
} from '@chakra-ui/react';
import Form from '@rjsf/chakra-ui';
import validator from '@rjsf/validator-ajv8';
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import schema from '../schema/mortar-schema.json';

const ConfigEditor = () => {
    const toast = useToast();

    const urlParams = new URLSearchParams(window.location.search);
    const apiParam = urlParams.get('api');

    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const currentFormDataRef = useRef(formData);

    const {colorMode, toggleColorMode} = useColorMode();
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBgColor = useColorModeValue('white', 'gray.800');
    const titleBarBg = useColorModeValue('gray.100', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    useEffect(() => {
        if (apiParam) {
            loadConfigFromApi(apiParam);
        }
    }, []);

    const loadConfigFromApi = async (apiAddress) => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://${apiAddress}:1337/config`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const config = await response.json();
            setFormData(config);

            toast({
                title: 'Configuration loaded from API',
                description: `Successfully loaded config from ${apiAddress}:1337`,
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top-middle',
            });
        } catch (error) {
            console.error('Failed to load config from API:', error);
            toast({
                title: 'Failed to load configuration',
                description: `Could not load config from ${apiAddress}:1337. ${error.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top-middle',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveConfigToApi = async (apiAddress) => {
        setIsLoading(true);
        try {
            const currentData = currentFormDataRef.current;
            setFormData(currentData)

            const response = await fetch(`http://${apiAddress}:1337/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast({
                title: 'Configuration saved to API',
                description: `Successfully saved config to ${apiAddress}:1337`,
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top-middle',
            });
        } catch (error) {
            console.error('Failed to save config to API:', error);
            toast({
                title: 'Failed to save configuration',
                description: `Could not save config to ${apiAddress}:1337. ${error.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top-middle',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        currentFormDataRef.current = formData;
    }, [formData]);

    const handleFormChange = useCallback(({formData: newFormData}) => {
        currentFormDataRef.current = newFormData;
    }, []);

    const ArrayFieldTemplate = (props) => {
        const {title, items, canAdd, onAddClick} = props;

        return (
            <Box mb={6}>
                <Flex
                    justify="space-between"
                    align="center"
                    mb={4}
                    pb={2}
                    borderBottom="2px solid"
                    borderColor={borderColor}
                >
                    <Heading size="md">{title}</Heading>
                    {canAdd && (
                        <Button
                            size="sm"
                            colorScheme="blue"
                            leftIcon={<AddIcon/>}
                            onClick={onAddClick}
                        >
                            Add {title?.slice(0, -1) || 'Item'}
                        </Button>
                    )}
                </Flex>

                <VStack spacing={4} align="stretch">
                    {items.map((element) => {
                        const itemData = element.children?.props?.formData;
                        const itemTitle = itemData?.display_name || `${title?.slice(0, -1) || 'Item'} #${element.index + 1}`;

                        return (
                            <Box key={element.key}>
                                <Flex
                                    bg={titleBarBg}
                                    border="1px solid"
                                    borderColor={borderColor}
                                    borderBottom="none"
                                    borderTopRadius="lg"
                                    px={4}
                                    py={2}
                                    align="center"
                                    justify="space-between"
                                >
                                    <HStack spacing={2}>
                                        <Text fontWeight="semibold" fontSize="md">
                                            {itemTitle}
                                        </Text>
                                        {itemData?.host_type && (
                                            <Badge colorScheme="blue" variant="subtle">
                                                {itemData.host_type}
                                            </Badge>
                                        )}
                                    </HStack>

                                    <ButtonGroup size="sm" variant="ghost">
                                        <IconButton
                                            icon={<ChevronUpIcon/>}
                                            aria-label="Move up"
                                            isDisabled={!element.hasMoveUp}
                                            onClick={element.onReorderClick(element.index, element.index - 1)}
                                        />
                                        <IconButton
                                            icon={<ChevronDownIcon/>}
                                            aria-label="Move down"
                                            isDisabled={!element.hasMoveDown}
                                            onClick={element.onReorderClick(element.index, element.index + 1)}
                                        />
                                        <IconButton
                                            icon={<CopyIcon/>}
                                            aria-label="Duplicate"
                                            onClick={() => {
                                                const newFormData = {...formData};
                                                if (newFormData.hosts) {
                                                    const itemCopy = JSON.parse(JSON.stringify(newFormData.hosts[element.index]));
                                                    itemCopy.display_name = `${itemCopy.display_name} (Copy)`;
                                                    newFormData.hosts.splice(element.index + 1, 0, itemCopy);
                                                    setFormData(newFormData);
                                                }
                                            }}
                                        />
                                        <IconButton
                                            icon={<DeleteIcon/>}
                                            aria-label="Remove"
                                            colorScheme="red"
                                            isDisabled={!element.hasRemove}
                                            onClick={element.onDropIndexClick(element.index)}
                                        />
                                    </ButtonGroup>
                                </Flex>

                                <Box
                                    border="1px solid"
                                    borderColor={borderColor}
                                    borderTop="none"
                                    borderBottomRadius="lg"
                                    p={4}
                                    bg={cardBgColor}
                                >
                                    {element.children}
                                </Box>
                            </Box>
                        );
                    })}
                </VStack>
            </Box>
        );
    };

    const uiSchema = useMemo(() => ({
        'ui:submitButtonOptions': {
            norender: true,
        },
        hosts: {
            'ui:options': {
                label: false,
            },
            items: {
                'ui:options': {
                    label: false
                },
                password: {
                    'ui:widget': 'password',
                },
                root_uri: {
                    'ui:placeholder': 'https://example.com',
                },
                platforms: {
                    'ui:options': {
                        orderable: true,
                    },
                    items: {
                        'ui:options': {
                            label: false
                        },
                        local_directory: {
                            'ui:placeholder': '/path/to/directory',
                        },
                    },
                },
                filters: {
                    inclusive_filters: {
                        'ui:options': {
                            orderable: true,
                        },
                        items: {
                            'ui:options': {
                                label: false
                            }
                        }
                    },
                    exclusive_filters: {
                        'ui:options': {
                            orderable: true,
                        },
                        items: {
                            'ui:options': {
                                label: false
                            }
                        }
                    },
                },
            },
        },
    }));

    const handleExport = () => {
        const currentData = currentFormDataRef.current;
        const dataStr = JSON.stringify(currentData, null, 2);

        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'mortar-config.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        toast({
            title: 'Configuration exported',
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    setFormData(config);
                    toast({
                        title: 'Configuration imported',
                        description: 'Your configuration has been imported successfully.',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                        position: 'top-middle',
                    });
                } catch (error) {
                    toast({
                        title: 'Invalid JSON file',
                        description: 'The file you selected is not a valid JSON file.',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                        position: 'top-middle',
                    });
                }
            };
            reader.readAsText(file);
        }
    };

    const MemoizedForm = React.memo(({schema, uiSchema, formData, onChange, templates}) => (
        <Form
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            validator={validator}
            onChange={onChange}
            onSubmit={() => {
            }}
            onError={(errors) => console.log('Validation errors:', errors)}
            templates={templates}
        />
    ));

    return (
        <Box minH="100vh" bg={bgColor}>
            <Container maxW="container.2xl" py={8}>
                <Card bg={cardBgColor} shadow="xl">
                    <CardHeader>
                        <Flex align="center">
                            <Heading size="lg">Mortar Configuration Editor</Heading>
                            <Spacer/>
                            <HStack spacing={4}>
                                {!apiParam && <Button
                                    as="label"
                                    leftIcon={<EditIcon/>}
                                    colorScheme="green"
                                    variant="solid"
                                    cursor="pointer"
                                    isDisabled={isLoading}
                                >
                                    Import
                                    <Input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        display="none"
                                    />
                                </Button>}
                                {!apiParam && <Button
                                    leftIcon={<DownloadIcon/>}
                                    colorScheme="blue"
                                    variant="solid"
                                    onClick={handleExport}
                                    isDisabled={isLoading}
                                >
                                    Export
                                </Button>}
                                {apiParam && <Button
                                    leftIcon={<ArrowUpIcon/>}
                                    colorScheme="green"
                                    variant="solid"
                                    onClick={() => saveConfigToApi(apiParam)}
                                    isDisabled={isLoading}
                                    isLoading={isLoading}
                                    loadingText="Saving..."
                                >
                                    Save to API
                                </Button>}
                                <IconButton
                                    icon={colorMode === 'light' ? <MoonIcon/> : <SunIcon/>}
                                    onClick={toggleColorMode}
                                    variant="ghost"
                                    aria-label="Toggle color mode"
                                />
                            </HStack>
                        </Flex>
                    </CardHeader>

                    <Divider/>

                    <CardBody>
                        <MemoizedForm
                            schema={schema}
                            uiSchema={uiSchema}
                            formData={formData}
                            onChange={handleFormChange}
                            templates={{ArrayFieldTemplate}}
                        />
                    </CardBody>
                </Card>
            </Container>
        </Box>
    );
};

export default ConfigEditor;