/* Stickman Fighter — building combat identities (powers depth)
 * Applies catalog hooks from src/data/buildings.js (rank 0–4 @ Lv 1/3/5/7/9).
 * Versus stays off. Never throw — fight must continue if a proc hiccups.
 */
(function (root) {
  'use strict';

  var POWER_MIN_RANK = {
    spark_kindle: { building: 'stick_lighter', rank: 0 },
    kindle_trail: { building: 'stick_lighter', rank: 1 },
    ember_pocket: { building: 'stick_lighter', rank: 2 },
    flare_step: { building: 'stick_lighter', rank: 3 },
    matchstick_storm: { building: 'stick_lighter', rank: 4 },
    sticky_soles: { building: 'woodchip_glue', rank: 0 },
    tacky_block: { building: 'woodchip_glue', rank: 1 },
    glue_trap: { building: 'woodchip_glue', rank: 2 },
    paste_armor: { building: 'woodchip_glue', rank: 3 },
    chip_golem: { building: 'woodchip_glue', rank: 4 },
    splinter_edge: { building: 'chipping_wood', rank: 0 },
    chip_spray: { building: 'chipping_wood', rank: 1 },
    sawdust_cloud: { building: 'chipping_wood', rank: 2 },
    hopper_guard: { building: 'chipping_wood', rank: 3 },
    chipper_fury: { building: 'chipping_wood', rank: 4 },
    boiler_hiss: { building: 'bamboo_boesa', rank: 0 },
    bamboo_vent: { building: 'bamboo_boesa', rank: 1 },
    bamboo_burst: { building: 'bamboo_boesa', rank: 2 },
    pressure_cook: { building: 'bamboo_boesa', rank: 3 },
    boesa_overheat: { building: 'bamboo_boesa', rank: 4 },
    taunt_toot: { building: 'echo_whistle', rank: 0 },
    mill_heckle: { building: 'echo_whistle', rank: 1 },
    echo_ridge: { building: 'echo_whistle', rank: 2 },
    ridge_reply: { building: 'echo_whistle', rank: 3 },
    whistle_chorus: { building: 'echo_whistle', rank: 4 }
  };

  function combatOk(game) {
    return !!(game && game.mode !== 'versus' && game.player && game.player.alive);
  }

  function saveOf(game) {
    return (game && game.save) || (typeof save !== 'undefined' ? save : null);
  }

  function hasPower(powerId, game) {
    if (typeof buildingHasPower === 'function') {
      try { return !!buildingHasPower(powerId, saveOf(game)); } catch (e) { /* fall */ }
    }
    var meta = POWER_MIN_RANK[powerId];
    if (!meta) return false;
    var ranks = (game && game.buildingPowerRanks) || {};
    var rank = ranks[meta.building];
    if (rank == null && typeof buildingPowerRank === 'function') {
      try { rank = buildingPowerRank(meta.building, saveOf(game)); } catch (e) { rank = -1; }
    }
    return (rank | 0) >= meta.rank;
  }

  function nowT(game) {
    return (game && game.t) || 0;
  }

  function stateOf(game) {
    if (!game.buildingCombat) {
      game.buildingCombat = {
        waveMelee: false,
        waveHurt: false,
        hopperGuard: false,
        glueArmed: false,
        cds: {},
        heat: 0,
        lastX: (game.player && game.player.x) || 0
      };
    }
    return game.buildingCombat;
  }

  function resetBuildingCombatWave(game) {
    if (!game) return;
    var st = stateOf(game);
    st.waveMelee = false;
    st.waveHurt = false;
    st.hopperGuard = false;
    st.glueArmed = hasPower('glue_trap', game);
    st.heat = 0;
    if (game.player) st.lastX = game.player.x || 0;
    if (hasPower('chip_golem', game) && game.player) {
      game.playerShieldT = Math.max(game.playerShieldT || 0, 2.4);
    }
  }

  function cdReady(st, key, t, cd) {
    if ((st.cds[key] || 0) > t) return false;
    st.cds[key] = t + cd;
    return true;
  }

  function labelOf(key, fallback) {
    if (typeof t === 'function') {
      const nested = t('buildings.power.' + key + '.label');
      if (nested && nested !== 'buildings.power.' + key + '.label') return nested;
      const flat = t('buildings.power.' + key);
      if (flat && flat !== 'buildings.power.' + key) return flat;
    }
    if (typeof tOr === 'function') return tOr('buildings.power.' + key, fallback);
    return fallback;
  }

  function nearestMonster(game, x, maxR) {
    var best = null;
    var bestD = maxR * maxR;
    var list = game.monsters || [];
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (!m || !m.alive) continue;
      var dx = m.x - x;
      var d = dx * dx;
      if (d < bestD) { bestD = d; best = m; }
    }
    return best;
  }

  function eachNear(game, x, maxR, fn) {
    var r2 = maxR * maxR;
    var list = game.monsters || [];
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (!m || !m.alive) continue;
      var dx = m.x - x;
      if (dx * dx <= r2) fn(m);
    }
  }

  function dealChip(game, target, dmg, kb, text, color) {
    if (!target || !target.alive || !game) return 0;
    var n = Math.max(1, Math.round(dmg));
    try {
      if (typeof target.takeDamage === 'function') {
        target.takeDamage(n, kb || 0, game, { quiet: n <= 2, kind: 'building', skipHitSfx: n <= 2 });
      }
    } catch (e) { return 0; }
    if (text && n >= 2 && game.floater) {
      try {
        game.floater(target.x, (target.y || 0) - ((target.size || 40) + 8), text, color || '#ff9a4d', 11, 'fx');
      } catch (e2) { /* ignore */ }
    }
    return n;
  }

  function emberOn(target, ticks, tickDmg) {
    if (!target || !target.alive) return;
    target.wpnBurnT = Math.max(target.wpnBurnT || 0, (ticks || 2) * 0.5);
    target.wpnBurnDmg = Math.max(target.wpnBurnDmg || 0, tickDmg || 1);
    target.wpnBurnTick = 0.5;
  }

  function slowTarget(target, dur, mul) {
    if (typeof applySuperMonsterSlow === 'function') {
      try { applySuperMonsterSlow(target, dur, mul); return; } catch (e) { /* fall */ }
    }
    if (!target) return;
    target.superSlowT = Math.max(target.superSlowT || 0, dur || 1);
    target.superSlowMul = Math.min(target.superSlowMul || 1, mul != null ? mul : 0.6);
  }

  function faceToward(target, player) {
    if (!target || !player) return;
    var dir = Math.sign(player.x - target.x) || 1;
    target.face = dir;
    target.vx = (target.vx || 0) * 0.35 + dir * 40;
  }

  function burstAt(game, x, y, color, n) {
    if (!game || typeof game.burst !== 'function') return;
    try {
      if (typeof fxLite === 'function' && fxLite()) return;
      game.burst(x, y, color, n || 6, { kind: 'spark', size: 2 });
    } catch (e) { /* ignore */ }
  }

  function applyBuildingCombatHook(game, hook, ctx) {
    if (!combatOk(game) || !hook) return;
    if (game.mode === 'wall' || game.mode === 'coinrun') return;
    ctx = ctx || {};
    try {
      var st = stateOf(game);
      var t = nowT(game);
      var player = game.player;
      var target = ctx.target;

      if (hook === 'onWaveStart') {
        resetBuildingCombatWave(game);
        return;
      }

      if (hook === 'onFirstMeleeHit' || hook === 'onWeaponHit' || hook === 'onComboStep') {
        if (!target) return;
        if (!st.waveMelee && hasPower('spark_kindle', game)) {
          st.waveMelee = true;
          emberOn(target, 3, 1);
          burstAt(game, target.x, target.y - 20, '#ff9a4d', 5);
        } else {
          st.waveMelee = true;
        }
        if (hook === 'onWeaponHit' && hasPower('ember_pocket', game) && cdReady(st, 'ember', t, 0.55)) {
          if (Math.random() < 0.22) {
            dealChip(game, target, 2, (player.face || 1) * 40, labelOf('ember_pocket', 'Spark'), '#ff9a4d');
            emberOn(target, 2, 1);
          }
        }
        if (hook === 'onWeaponHit' && hasPower('splinter_edge', game) && cdReady(st, 'splinter', t, 0.4)) {
          dealChip(game, target, 1, (player.face || 1) * 70, labelOf('splinter_edge', 'Chip'), '#7cfc8a');
        }
        var combo = game.combo || 0;
        if (hasPower('chip_spray', game) && combo >= 3 && cdReady(st, 'spray', t, 0.7)) {
          dealChip(game, target, 2, 0, labelOf('chip_spray', 'Spray'), '#7cfc8a');
        }
        if (hasPower('chipper_fury', game) && combo >= 6 && cdReady(st, 'fury', t, 0.9)) {
          eachNear(game, target.x, 90, function (m) {
            dealChip(game, m, 3, 0, null, '#7cfc8a');
          });
          burstAt(game, target.x, target.y - 16, '#7cfc8a', 8);
        }
        if (hasPower('pressure_cook', game)) {
          st.heat = (st.heat || 0) + 1;
          if (st.heat >= 5) {
            st.heat = 0;
            dealChip(game, target, 3, (player.face || 1) * 90, labelOf('pressure_cook', 'Steam'), '#ff7a4d');
          }
        }
        if (hasPower('boesa_overheat', game) && player.hp <= player.maxhp * 0.3 && cdReady(st, 'overhit', t, 0.45)) {
          dealChip(game, target, 2, 0, labelOf('boesa_overheat', 'Heat'), '#ff7a4d');
        }
        if (st.glueArmed && hasPower('glue_trap', game)) {
          st.glueArmed = false;
          slowTarget(target, 1.35, 0.55);
          if (game.floater) {
            try { game.floater(target.x, target.y - 28, labelOf('glue_trap', 'Glue'), '#c9a66b', 12, 'fx'); } catch (e3) { /* ignore */ }
          }
        }
        return;
      }

      if (hook === 'onActiveCast') {
        if (hasPower('sawdust_cloud', game)) {
          game.buildingSawdustT = Math.max(game.buildingSawdustT || 0, 0.85);
          burstAt(game, player.x + (player.face || 1) * 36, player.y - 40, '#c9b691', 7);
        }
        if (hasPower('bamboo_burst', game) && cdReady(st, 'burst', t, 3.2)) {
          eachNear(game, player.x + (player.face || 1) * 50, 88, function (m) {
            dealChip(game, m, 4, (player.face || 1) * 160, labelOf('bamboo_burst', 'Boesa'), '#ff7a4d');
          });
        }
        if (hasPower('matchstick_storm', game) && cdReady(st, 'storm', t, 7.5)) {
          eachNear(game, player.x + (player.face || 1) * 40, 100, function (m) {
            emberOn(m, 4, 1);
            dealChip(game, m, 3, (player.face || 1) * 50, labelOf('matchstick_storm', 'Match'), '#ff9a4d');
          });
        } else if (hasPower('flare_step', game) && cdReady(st, 'flarecast', t, 4.5)) {
          var lined = nearestMonster(game, player.x + (player.face || 1) * 70, 110);
          if (lined) emberOn(lined, 3, 1);
        }
        if (hasPower('whistle_chorus', game) && cdReady(st, 'chorus', t, 6.5)) {
          eachNear(game, player.x, 150, function (m) {
            faceToward(m, player);
            slowTarget(m, 0.85, 0.62);
          });
          if (game.floater) {
            try { game.floater(player.x, player.y - 100, labelOf('whistle_chorus', 'Chorus'), '#7cf5ff', 13, 'fx'); } catch (e4) { /* ignore */ }
          }
        } else if (hasPower('taunt_toot', game) && cdReady(st, 'toot', t, 2.8)) {
          var foe = nearestMonster(game, player.x, 160);
          if (foe) {
            faceToward(foe, player);
            if (game.floater) {
              try { game.floater(foe.x, foe.y - 22, labelOf('taunt_toot', 'Toot'), '#7cf5ff', 12, 'fx'); } catch (e5) { /* ignore */ }
            }
          }
        }
        if (hasPower('glue_trap', game)) st.glueArmed = true;
        return;
      }

      if (hook === 'onDash') {
        if (hasPower('flare_step', game) && cdReady(st, 'flare', t, 1.1)) {
          eachNear(game, player.x, 70, function (m) { emberOn(m, 2, 1); });
          burstAt(game, player.x, player.y - 30, '#ff9a4d', 6);
        }
        if (hasPower('bamboo_vent', game) && cdReady(st, 'vent', t, 1.2)) {
          var shove = nearestMonster(game, player.x + (player.face || 1) * 40, 95);
          if (shove) {
            shove.vx = (shove.vx || 0) + (player.face || 1) * 220;
            dealChip(game, shove, 1, (player.face || 1) * 120, labelOf('bamboo_vent', 'Vent'), '#ff7a4d');
          }
        }
        return;
      }

      if (hook === 'onHurt' || hook === 'onKnockback') {
        if (!st.waveHurt) st.waveHurt = true;
        if (hasPower('mill_heckle', game) && cdReady(st, 'heckle', t, 1.4)) {
          var heck = nearestMonster(game, player.x, 140);
          if (heck) faceToward(heck, player);
        }
        return;
      }

      if (hook === 'onBlock') {
        if (hasPower('ridge_reply', game) && ctx.parry && cdReady(st, 'reply', t, 1.6)) {
          var pip = nearestMonster(game, player.x, 120);
          if (pip) slowTarget(pip, 0.7, 0.5);
        }
        return;
      }

      if (hook === 'onKill' && target) {
        if (hasPower('echo_ridge', game) && cdReady(st, 'ridge', t, 0.35)) {
          eachNear(game, target.x, 96, function (m) { slowTarget(m, 0.9, 0.58); });
          burstAt(game, target.x, target.y - 18, '#7cf5ff', 7);
        }
      }
    } catch (err) {
      try { if (typeof sfReportError === 'function') sfReportError('building/combat', err, 'Fabriek-proc hiccup'); } catch (e6) { /* ignore */ }
    }
  }

  function tickBuildingCombat(game, dt) {
    if (!combatOk(game) || game.mode === 'wall' || game.mode === 'coinrun') return;
    if (!(dt > 0)) return;
    try {
      var st = stateOf(game);
      var player = game.player;
      var t = nowT(game);
      if (game.buildingSawdustT > 0) game.buildingSawdustT -= dt;

      if (hasPower('kindle_trail', game) && Math.abs((player.x || 0) - (st.lastX || 0)) > 36 && cdReady(st, 'trail', t, 1.55)) {
        var crumb = nearestMonster(game, player.x, 78);
        if (crumb) emberOn(crumb, 2, 1);
        burstAt(game, player.x, player.y - 8, '#ff9a4d', 4);
        st.lastX = player.x;
      } else if (Math.abs((player.x || 0) - (st.lastX || 0)) > 8) {
        st.lastX = player.x;
      }

      var auraCd = hasPower('boesa_overheat', game) && player.hp <= player.maxhp * 0.3 ? 0.95 : 1.45;
      if (hasPower('boiler_hiss', game) && cdReady(st, 'hiss', t, auraCd)) {
        eachNear(game, player.x, 62, function (m) {
          dealChip(game, m, 1, 0, null, '#ff7a4d');
        });
      }
    } catch (err) {
      try { if (typeof sfReportError === 'function') sfReportError('building/tick', err); } catch (e) { /* ignore */ }
    }
  }

  function applyBuildingIncoming(game, player, dmg, opts) {
    if (!combatOk(game) || !player || !player.isPlayer) return dmg;
    opts = opts || {};
    var st = stateOf(game);
    var n = dmg;
    if (!st.hopperGuard && hasPower('hopper_guard', game)) {
      st.hopperGuard = true;
      n = Math.max(1, Math.round(n * 0.55));
    }
    if ((game.buildingSawdustT || 0) > 0) {
      n = Math.max(1, Math.round(n * 0.72));
    }
    return n;
  }

  root.applyBuildingCombatHook = applyBuildingCombatHook;
  root.tickBuildingCombat = tickBuildingCombat;
  root.resetBuildingCombatWave = resetBuildingCombatWave;
  root.applyBuildingIncoming = applyBuildingIncoming;
  root.BUILDING_POWER_MIN_RANK = POWER_MIN_RANK;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { applyBuildingCombatHook: applyBuildingCombatHook, tickBuildingCombat: tickBuildingCombat };
  }
})(typeof window !== 'undefined' ? window : globalThis);
