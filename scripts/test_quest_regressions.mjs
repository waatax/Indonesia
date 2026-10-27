import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCourse, createGame, KEY, DAY } from '../quest/engine.mjs';

const read = file => JSON.parse(fs.readFileSync(new URL(`../quest/course/${file}.json`, import.meta.url), 'utf8'));
const course = createCourse(read('index'));
for (const id of ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 'stories', 'vocab']) course.register(read(id));
let time = new Date('2026-10-27T12:00:00+08:00').getTime();
const memory = new Map();
const storage = { getItem: k => memory.get(k), setItem: (k, v) => memory.set(k, v) };
const make = () => createGame({ course, storage, now: () => time });
const answer = g => g.currentItem().type === 'match' ? 'matched' : g.currentItem().answer;
let game = make();
assert.equal(game.startLesson('u1-1:boss'), null, 'Locked bosses cannot be opened');
game.startLesson('u1-1:word');
assert.equal(game.next(), null, 'Cannot advance without an answer');
assert.equal(game.finishSession(), null, 'Cannot award incomplete sessions');
const item = game.currentItem();
game.submit('WRONG');
const queueLength = game.currentSession().queue.length;
game.submit('WRONG');
assert.equal(game.currentSession().queue.length, queueLength, 'Double submits cannot duplicate retries');
game = make();
assert.ok(game.currentSession().mistakes instanceof Set, 'Restore session Sets');
assert.ok(game.currentSession().mistakes.has(item.id), 'Restore mistakes');
assert.equal(game.currentSession().feedback.correct, false, 'Restore submitted feedback');
game.next();
assert.equal(make().currentSession().current, 1, 'Save current position after next');
while (game.currentSession()) { game.submit(answer(game)); game.next(); }
assert.ok(game.state.nodes['u1-1:word'].n);
assert.ok(game.state.review[item.id].due > time);
const xp = game.state.xp.total;
assert.equal(game.next(), null);
assert.equal(game.state.xp.total, xp, 'Completed sessions cannot earn twice');
assert.equal(game.startPractice('due'), null, 'No phantom due review');
time += DAY + 1000;
assert.ok(game.dueItems().includes(item.id), 'Review is due the next day');
game.startPractice('due');
const reviewed = game.currentItem().id;
game.submit(answer(game)); game.next();
assert.equal(game.state.review[reviewed].level, 1);
assert.equal(game.state.review[reviewed].due, time + 3 * DAY, 'Next interval is three days');
game.cancelSession();
game.state.quests.list = [{ id: 'combo', n: 0, target: 5, done: false }];
game.state.quests.day = game.today();
game.startLesson('u1-1:word');
for (let i = 0; i < 3; i++) { game.submit(answer(game)); game.next(); }
game.submit('WRONG'); game.next();
assert.equal(game.state.quests.list[0].n, 0, 'Wrong answers reset unfinished consecutive-answer quest');
game.submit(answer(game)); game.next();
assert.equal(game.state.quests.list[0].n, 1);
game.cancelSession();
const unit = course.units.get('u1-1');
for (const n of unit.nodes.filter(n => n.kind !== 'boss')) game.state.nodes[n.id] = { n: 1 };
const boss = unit.nodes.find(n => n.kind === 'boss');
const beforeBoss = game.state.xp.total;
assert.ok(game.startLesson(boss.id));
for (let i = 0; i < 3; i++) { game.submit('WRONG'); const result = game.next(); if (i === 2) assert.ok(result.failed); }
assert.equal(game.currentSession(), null);
assert.equal(game.state.crowns[unit.id], undefined, 'No crown after heart exhaustion');
assert.equal(game.state.xp.total, beforeBoss, 'No XP after heart exhaustion');
game.setGoal('serious');
assert.equal(make().goalXp(), 30, 'Daily goal survives reload');
assert.ok(JSON.parse(memory.get(KEY)), 'Saved data is valid JSON');
const broken = createGame({ course, storage: { getItem() { return '{'; }, setItem() { throw Error('full'); } } });
broken.save();
assert.ok(broken.warning, 'Storage failures are visible');
console.log('PASS: persistence, feedback, duplicate submissions, locked nodes, mastery, SRS intervals, combo reset, boss failure, daily goal and storage warning.');
const complete = createGame({ course });
let lessons = 0;
for (const node of course.nodes.values()) {
  assert.ok(complete.startLesson(node.id), `Reachable lesson ${node.id}`);
  while (complete.currentSession()) { complete.submit(answer(complete)); complete.next(); }
  assert.ok(complete.state.nodes[node.id].n, `Completion saved for ${node.id}`);
  lessons++;
}
for (const story of course.stories.values()) {
  assert.ok(complete.startStory(story.id));
  while (complete.currentSession()) { complete.submit(answer(complete)); complete.next(); }
  assert.ok(complete.state.stories[story.id]);
}
console.log(`PASS: all ${lessons} lessons and ${course.stories.size} stories complete without dead ends.`);
