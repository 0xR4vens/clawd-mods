#!/usr/bin/env bash
# clawd-mods status line: Claude Code pipes the session as JSON on stdin and
# shows what this prints under the prompt. Usage over the 5-hour and the
# weekly windows as small bars with their percent and reset time (a red ⚠
# from 80% over 5 hours, 90% over the week), the
# context used, and the model, pushed to the right of the line.
in=$(cat)
get() { jq -r "$1 // empty" <<<"$in" 2>/dev/null; }

model=$(get '.model.display_name // .model.id')
ctx=$(get '.context_window.used_percentage | floor')
five=$(get '.rate_limits.five_hour.used_percentage | floor')
five_at=$(get '.rate_limits.five_hour.resets_at')
week=$(get '.rate_limits.seven_day.used_percentage | floor')
week_at=$(get '.rate_limits.seven_day.resets_at')

esc=$'\e'
off="$esc[0m"; dim="$esc[2m"; orange="$esc[38;2;217;119;87m"

# A bar of 10 cells, eighths for the last one, green then amber then red.
bar() {
  local p=$1 full eighths i out='' color rest
  (( p > 100 )) && p=100
  if (( p >= 80 )); then color="$esc[38;2;229;83;75m"
  elif (( p >= 50 )); then color="$esc[38;2;230;180;80m"
  else color="$esc[38;2;98;196;120m"; fi
  full=$(( p / 10 )); eighths=$(( (p % 10) * 8 / 10 ))
  local parts=('' '▏' '▎' '▍' '▌' '▋' '▊' '▉')
  for (( i = 0; i < full; i++ )); do out+='█'; done
  rest=$(( 10 - full ))
  if (( eighths > 0 )); then out+="${parts[$eighths]}"; rest=$(( rest - 1 )); fi
  printf '%s%s%s' "$color" "$out" "$esc[38;2;70;70;78m"
  for (( i = 0; i < rest; i++ )); do printf '░'; done
  printf '%s' "$off"
}

export TZ=Europe/Paris
sep='     '
line='' plain=''
add() {
  if [ -n "$plain" ]; then line+="$sep"; plain+="$sep"; fi
  line+="$1"; plain+="$2"
}
# The weekday in French without needing a French locale.
day() {
  local names=(lun mar mer jeu ven sam dim) n
  n=$(date -d "@$1" +%u 2>/dev/null) || return
  printf '%s %s' "${names[$((n - 1))]}" "$(date -d "@$1" +%H:%M)"
}

if [ -n "$five" ]; then
  at=$( [ -n "$five_at" ] && date -d "@$five_at" +%H:%M 2>/dev/null )
  warn=''; (( five >= 80 )) && warn="${esc}[38;2;229;83;75m⚠ ${off}"
  add "${warn}${dim}5h${off} ${dim}▕${off}$(bar "$five")${dim}▏${off} ${five}%${dim}${at:+  ↻ $at}${off}" "${warn:+⚠ }5h ▕##########▏ ${five}%${at:+  ↻ $at}"
fi
if [ -n "$week" ]; then
  at=$( [ -n "$week_at" ] && day "$week_at" )
  warn=''; (( week >= 90 )) && warn="${esc}[38;2;229;83;75m⚠ ${off}"
  add "${warn}${dim}sem${off} ${dim}▕${off}$(bar "$week")${dim}▏${off} ${week}%${dim}${at:+  ↻ $at}${off}" "${warn:+⚠ }sem ▕##########▏ ${week}%${at:+  ↻ $at}"
fi
[ -n "$ctx" ] && add "${dim}ctx${off} ${ctx}%" "ctx ${ctx}%"
add "${orange}◆ ${model:-Claude}${off}" "◆ ${model:-Claude}"
now=$(date +%H:%M)
add "${dim}${now}${off}" "$now"

# One line, pushed right; the margin leaves room for the footer's own padding
# so it never wraps onto a second line.
cols=${COLUMNS:-0}
width=$(printf '%s' "$plain" | wc -m)
pad=$(( cols - width - 6 ))
# Claude Code trims leading spaces, so the padding is the blank braille cell
# (U+2800): one column wide, drawn as nothing, and not whitespace.
if (( pad > 0 )); then
  blank=$'\u2800'
  fill=''
  for (( i = 0; i < pad; i++ )); do fill+=$blank; done
  printf '%s' "$fill"
fi
printf '%s\n' "$line"
