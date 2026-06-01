export function formatTime(milliseconds) {
  const totalSeconds = Math.floor(Math.max(milliseconds, 0) / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function progressPercentage(currentTime, duration) {
  return duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
}

export function remainingTime(duration, currentTime) {
  return Math.max(duration - currentTime, 0);
}
