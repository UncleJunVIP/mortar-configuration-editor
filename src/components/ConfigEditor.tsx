import {
    AddIcon,
    AttachmentIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CopyIcon,
    DeleteIcon,
    DownloadIcon,
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
import React, {useState} from 'react';
import schema from '../schema/mortar-schema.json';

const ConfigEditor = () => {
    const [formData, setFormData] = useState({});
    const {colorMode, toggleColorMode} = useColorMode();
    const toast = useToast();
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBgColor = useColorModeValue('white', 'gray.800');
    const titleBarBg = useColorModeValue('gray.100', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const ArrayFieldTemplate = (props) => {
        const {title, items, canAdd, onAddClick} = props;

        return (
            <Box mb={6}>
                {/* Section header */}
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

                {/* Array items */}
                <VStack spacing={4} align="stretch">
                    {items.map((element) => {
                        const itemData = element.children?.props?.formData;
                        const itemTitle = itemData?.display_name || `${title?.slice(0, -1) || 'Item'} #${element.index + 1}`;

                        return (
                            <Box key={element.key}>
                                {/* Title bar with controls */}
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

                                {/* Content area */}
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

    const uiSchema = {
        hosts: {
            'ui:options': {
                label: false,  // Hide the "Hosts" label if you want
            },
            items: {
                'ui:options': {
                    label: false  // This hides the "Item-1", "Item-2" labels
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
                            label: false  // Hide platform item labels
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
                                label: false  // Hide filter item labels
                            }
                        }
                    },
                    exclusive_filters: {
                        'ui:options': {
                            orderable: true,
                        },
                        items: {
                            'ui:options': {
                                label: false  // Hide filter item labels
                            }
                        }
                    },
                },
            },
        },
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(formData, null, 2);
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

    return (
        <Box minH="100vh" bg={bgColor}>
            <Container maxW="container.2xl" py={8}>
                <Card bg={cardBgColor} shadow="xl">
                    <CardHeader>
                        <Flex align="center">
                            <Heading size="lg">Mortar Configuration Editor</Heading>
                            <Spacer/>
                            <HStack spacing={4}>
                                <Button
                                    as="label"
                                    leftIcon={<AttachmentIcon/>}
                                    colorScheme="green"
                                    variant="solid"
                                    cursor="pointer"
                                >
                                    Import
                                    <Input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        display="none"
                                    />
                                </Button>
                                <Button
                                    leftIcon={<DownloadIcon/>}
                                    colorScheme="blue"
                                    variant="solid"
                                    onClick={handleExport}
                                >
                                    Export
                                </Button>
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
                        <Form
                            schema={schema}
                            uiSchema={uiSchema}
                            formData={formData}
                            validator={validator}
                            onChange={({formData}) => setFormData(formData)}
                            onSubmit={() => {
                            }}
                            onError={(errors) => console.log('Validation errors:', errors)}
                            templates={{ArrayFieldTemplate}}
                        />
                    </CardBody>
                </Card>
            </Container>
        </Box>
    );
};

export default ConfigEditor;