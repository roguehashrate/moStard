import { Flex, Skeleton, SkeletonCircle, SkeletonText } from "@chakra-ui/react";

export function NoteSkeleton() {
  return (
    <Flex
      direction="column"
      borderWidth="1px"
      rounded="2xl"
      borderColor="chakra-border-color"
      bg="chakra-subtle-bg"
      p="3"
      gap="3"
    >
      <Flex gap="3" alignItems="center">
        <SkeletonCircle size="8" />
        <Flex direction="column" gap="1" flex="1">
          <Skeleton height="12px" width="100px" borderRadius="full" />
          <Skeleton height="10px" width="60px" borderRadius="full" />
        </Flex>
      </Flex>
      <SkeletonText noOfLines={3} spacing="2" skeletonHeight="3" />
      <Skeleton height="3" width="40%" borderRadius="full" />
    </Flex>
  );
}

export function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <NoteSkeleton key={i} />
      ))}
    </>
  );
}
