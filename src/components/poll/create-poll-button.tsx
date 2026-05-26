import { useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEventFactory } from "applesauce-react/hooks";
import { includeAltTag, setContent } from "applesauce-factory/operations/event";

import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { PollIcon } from "../icons";

function randomId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export default function CreatePollButton() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const publish = usePublishEvent();
  const factory = useEventFactory();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { id: randomId(), label: "" },
    { id: randomId(), label: "" },
  ]);
  const [pollType, setPollType] = useState<"singlechoice" | "multiplechoice">("singlechoice");
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => setOptions((prev) => [...prev, { id: randomId(), label: "" }]);
  const removeOption = (id: string) => setOptions((prev) => prev.filter((o) => o.id !== id));
  const updateOption = (id: string, label: string) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));

  const canSubmit = question.trim() && options.filter((o) => o.label.trim()).length >= 2 && !submitting;

  const reset = () => {
    setQuestion("");
    setOptions([
      { id: randomId(), label: "" },
      { id: randomId(), label: "" },
    ]);
    setPollType("singlechoice");
    setHasEndTime(false);
    setEndDate("");
    setEndTime("");
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const validOptions = options.filter((o) => o.label.trim());

      let endsAt: number | undefined;
      if (hasEndTime && endDate) {
        const dateStr = endTime ? `${endDate}T${endTime}:00` : `${endDate}T23:59:00`;
        endsAt = Math.floor(new Date(dateStr).getTime() / 1000);
      }

      const tags: string[][] = [...validOptions.map((o) => ["option", o.id, o.label.trim()]), ["polltype", pollType]];
      if (endsAt) tags.push(["endsAt", String(endsAt)]);

      const draft = await factory.build(
        { kind: 1068, tags },
        setContent(question.trim()),
        includeAltTag(`Poll: ${question.trim()}`),
      );

      await publish("Post poll", draft);
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <IconButton icon={<PollIcon boxSize="1.3em" />} onClick={onOpen} aria-label="Create poll" title="Create poll" />

      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "lg"}>
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <ModalHeader>Create Poll</ModalHeader>
            <ModalBody>
              <Flex direction="column" gap="4">
                <FormControl isRequired>
                  <FormLabel>Question</FormLabel>
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What do you want to ask?"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Options</FormLabel>
                  <Flex direction="column" gap="2">
                    {options.map((option, i) => (
                      <Flex key={option.id} gap="2" alignItems="center">
                        <Input
                          value={option.label}
                          onChange={(e) => updateOption(option.id, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                        />
                        {options.length > 2 && (
                          <Button size="sm" variant="ghost" colorScheme="red" onClick={() => removeOption(option.id)}>
                            &times;
                          </Button>
                        )}
                      </Flex>
                    ))}
                    <Button size="sm" variant="ghost" onClick={addOption} mt="1">
                      + Add option
                    </Button>
                  </Flex>
                </FormControl>

                <FormControl>
                  <FormLabel>Poll type</FormLabel>
                  <Select
                    value={pollType}
                    onChange={(e) => setPollType(e.target.value as "singlechoice" | "multiplechoice")}
                  >
                    <option value="singlechoice">Single choice</option>
                    <option value="multiplechoice">Multiple choice</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <Flex alignItems="center" gap="2">
                    <Switch isChecked={hasEndTime} onChange={(e) => setHasEndTime(e.target.checked)} />
                    <FormLabel mb="0">Set end time</FormLabel>
                  </Flex>
                </FormControl>

                {hasEndTime && (
                  <Flex gap="2">
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} flex={1} />
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} flex={1} />
                  </Flex>
                )}
              </Flex>
            </ModalBody>

            <ModalFooter gap="2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="primary" onClick={submit} isLoading={submitting} isDisabled={!canSubmit}>
                Post Poll
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
