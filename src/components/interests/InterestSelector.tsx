'use client';

import { Box, Tag as ChakraTag, SimpleGrid, Spinner, Text } from '@chakra-ui/react';

interface InterestSelectorProps {
  selectedInterests: string[];
  onSelectionChange: (interests: string[]) => void;
  categories: string[];
  isLoading?: boolean;
  error?: string;
}

/**
 * Component for selecting user interests
 * Displays all available categories from database as selectable tags
 */
export function InterestSelector({
  selectedInterests,
  onSelectionChange,
  categories,
  isLoading,
  error,
}: InterestSelectorProps) {
  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      // Remove interest
      onSelectionChange(selectedInterests.filter(i => i !== interest));
    } else {
      // Add interest
      onSelectionChange([...selectedInterests, interest]);
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
        <Text mt={2} color="secondaryText.500">
          Loading categories...
        </Text>
      </Box>
    );
  }

  if (categories.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="secondaryText.500">No categories available</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="sm" color="secondaryText.500" mb={4}>
        Select your interests to get personalized book recommendations (select at least 1)
      </Text>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={3}>
        {categories.map(category => {
          const isSelected = selectedInterests.includes(category);
          return (
            <ChakraTag.Root
              key={category}
              cursor="pointer"
              variant={isSelected ? 'solid' : 'outline'}
              colorPalette={isSelected ? 'orange' : 'gray'}
              onClick={() => handleInterestToggle(category)}
              _hover={{
                bg: isSelected ? 'orange.600' : 'gray.100',
                transform: 'scale(1.05)',
              }}
              transition="all 0.2s"
              justifyContent="center"
              py={3}
              px={4}
              rounded="lg"
              borderWidth="1.5px"
              borderColor={isSelected ? 'orange.500' : 'gray.300'}
            >
              <ChakraTag.Label
                fontWeight={isSelected ? 'bold' : 'medium'}
                color={isSelected ? 'white' : 'gray.700'}
                fontSize="sm"
                textAlign="center"
              >
                {category}
              </ChakraTag.Label>
            </ChakraTag.Root>
          );
        })}
      </SimpleGrid>
      {error && (
        <Text color="red.500" fontSize="sm" mt={2} px={1}>
          {error}
        </Text>
      )}
      {selectedInterests.length > 0 && (
        <Text fontSize="sm" color="secondaryText.500" mt={4}>
          {selectedInterests.length} interest{selectedInterests.length > 1 ? 's' : ''} selected
        </Text>
      )}
    </Box>
  );
}
