import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { useState } from "react";
import TimerIcon from "@mui/icons-material/Timer";
import { AppIcon } from "./app-icon.tsx";
import { useInterval } from "../tools.ts";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

const arraySum = (array: number[]) => array.reduce((acc, curr) => acc + curr, 0);

const progressWidth = "100%";

const Timer = ({ lengths, maxCycle }: { lengths: number[]; maxCycle: number }) => {
  const [time, setTime] = useState(0);
  const [run, setRun] = useState(false);
  const [cycles, setCycles] = useState(0);
  const cycleTime = arraySum(lengths);

  useInterval(
    () => {
      if (cycles >= maxCycle) {
        resetCycles();
        return;
      }

      if (time > cycleTime) {
        setTime(0);
        setCycles((old) => old + 1);
      } else setTime((oldTime) => oldTime + 0.1);
    },
    100,
    run,
  );

  const playPause = () => {
    setRun(!run);
  };

  const resetCycles = () => {
    setRun(false);
    setTime(0);
    setCycles(0);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <IconButton onClick={playPause} sx={{ fontSize: "5em" }}>
          {run ? <PauseIcon fontSize="inherit" /> : <PlayArrowIcon fontSize="inherit" />}
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%", gap: 1, mt: 2 }}>
        {lengths.map((length, index) => {
          const elapsed = time - arraySum(lengths.slice(0, index));
          return (
            <Box key={index}>
              {Math.min(length, Math.max(0, elapsed)).toFixed(1)}s / {length}s
              <LinearProgress
                variant="determinate"
                sx={{ width: progressWidth }}
                value={Math.min(1, elapsed / length) * 100}
              />
            </Box>
          );
        })}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            Time: <Timedelta value={time + cycleTime * cycles} /> / <Timedelta value={cycleTime * maxCycle} />
          </Box>
          <Box>
            <Button onClick={resetCycles}>reset</Button>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          sx={{ width: progressWidth }}
          value={((time + cycleTime * cycles) / (cycleTime * maxCycle)) * 100}
        />
      </Box>
    </Box>
  );
};

const TimerDialogContent = () => {
  return (
    <DialogContent>
      <Timer lengths={[4, 1, 8, 1]} maxCycle={10} />
    </DialogContent>
  );
};

export const SimpleLoopTimer = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppIcon icon={TimerIcon} title="Loop timer" onOpen={() => setOpen(true)} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Loop timer</DialogTitle>
        <TimerDialogContent />
        <DialogActions>
          <Button onClick={() => setOpen(false)}>close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const Timedelta = ({ value }: { value: number }) => {
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value - hours * 3600) / 60);
  const seconds = Math.round(value % 60);

  return (
    <span>
      {hours ? `${hours}:` : ""}
      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </span>
  );
};
