import { Button, Spinner } from "@chakra-ui/react";
import { TimelineLoader } from "applesauce-loaders/loaders";
import { useState } from "react";

export default function TimelineActionAndStatus({ loader }: { loader?: TimelineLoader }) {
  const [loading, setLoading] = useState(false);

  if (!loader) return null;

  if (loading) {
    return <Spinner ml="auto" mr="auto" mt="8" mb="8" flexShrink={0} />;
  }

  return (
    <Button
      onClick={() => {
        setLoading(true);
        loader().subscribe({ complete: () => setLoading(false), error: () => setLoading(false) });
      }}
      flexShrink={0}
      size="lg"
      mx="auto"
      colorScheme="primary"
      my="4"
    >
      Load More
    </Button>
  );
}
