package com.jbes.lifestealspawn.listener;

import com.jbes.lifestealspawn.manager.TemporaryBlockManager;
import com.jbes.lifestealspawn.util.RegionUtils;
import org.bukkit.Location;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.event.entity.CreatureSpawnEvent;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockBurnEvent;
import org.bukkit.event.block.BlockExplodeEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.block.BlockSpreadEvent;
import org.bukkit.event.entity.EntityChangeBlockEvent;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityExplodeEvent;
import org.bukkit.event.player.PlayerBucketEmptyEvent;
import org.bukkit.event.player.PlayerBucketFillEvent;
import org.bukkit.plugin.Plugin;
import org.bukkit.projectiles.ProjectileSource;

public final class ProtectionListener implements Listener {
    private final Plugin plugin;
    private final TemporaryBlockManager temporaryBlocks;

    public ProtectionListener(Plugin plugin, TemporaryBlockManager temporaryBlocks) {
        this.plugin = plugin;
        this.temporaryBlocks = temporaryBlocks;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onBreak(BlockBreakEvent event) {
        FileConfiguration config = plugin.getConfig();
        Location location = event.getBlock().getLocation();
        if (isProtectedSpawn(location, config)) {
            event.setCancelled(true);
            return;
        }
        if (RegionUtils.isInsideBuffer(location, config)) {
            if (temporaryBlocks.isTemporary(event.getBlock())) {
                temporaryBlocks.untrack(event.getBlock());
                return;
            }
            if (config.getBoolean("protect-buffer-terrain", true)) {
                event.setCancelled(true);
            }
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onPlace(BlockPlaceEvent event) {
        FileConfiguration config = plugin.getConfig();
        Location location = event.getBlockPlaced().getLocation();
        if (isProtectedSpawn(location, config)) {
            event.setCancelled(true);
            return;
        }
        if (RegionUtils.isInsideBuffer(location, config) && config.getBoolean("temporary-blocks-in-buffer", true)) {
            temporaryBlocks.track(event.getBlockPlaced(), config.getInt("placed-block-remove-delay-seconds", 30));
            Player player = event.getPlayer();
            player.sendMessage("Temporary buffer block: removes in " + config.getInt("placed-block-remove-delay-seconds", 30) + "s");
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onBucketEmpty(PlayerBucketEmptyEvent event) {
        if (RegionUtils.isInsidePreparedArea(event.getBlockClicked().getRelative(event.getBlockFace()).getLocation(), plugin.getConfig())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onBucketFill(PlayerBucketFillEvent event) {
        if (RegionUtils.isInsidePreparedArea(event.getBlockClicked().getLocation(), plugin.getConfig())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onEntityExplode(EntityExplodeEvent event) {
        event.blockList().removeIf(block -> RegionUtils.isInsidePreparedArea(block.getLocation(), plugin.getConfig()));
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onBlockExplode(BlockExplodeEvent event) {
        event.blockList().removeIf(block -> RegionUtils.isInsidePreparedArea(block.getLocation(), plugin.getConfig()));
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onBurn(BlockBurnEvent event) {
        if (RegionUtils.isInsidePreparedArea(event.getBlock().getLocation(), plugin.getConfig())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onSpread(BlockSpreadEvent event) {
        if (RegionUtils.isInsidePreparedArea(event.getBlock().getLocation(), plugin.getConfig())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onEntityChangeBlock(EntityChangeBlockEvent event) {
        if (RegionUtils.isInsidePreparedArea(event.getBlock().getLocation(), plugin.getConfig())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onCreatureSpawn(CreatureSpawnEvent event) {
        if (RegionUtils.isInsidePreparedArea(event.getLocation(), plugin.getConfig())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onPlayerDamageByPlayer(EntityDamageByEntityEvent event) {
        FileConfiguration config = plugin.getConfig();
        if (!config.getBoolean("disable-pvp-in-spawn", true)) {
            return;
        }
        if (!(event.getEntity() instanceof Player victim)) {
            return;
        }
        Player attacker = getAttackingPlayer(event.getDamager());
        if (attacker == null) {
            return;
        }

        if (RegionUtils.isInsideSpawn(victim.getLocation(), config) || RegionUtils.isInsideSpawn(attacker.getLocation(), config)) {
            event.setCancelled(true);
            attacker.sendMessage("PvP is disabled inside spawn. Move past the red border or into the buffer to fight.");
        }
    }

    private boolean isProtectedSpawn(Location location, FileConfiguration config) {
        return config.getBoolean("protect-spawn", true) && RegionUtils.isInsideSpawn(location, config);
    }

    private Player getAttackingPlayer(Entity damager) {
        if (damager instanceof Player player) {
            return player;
        }
        if (damager instanceof Projectile projectile) {
            ProjectileSource shooter = projectile.getShooter();
            if (shooter instanceof Player player) {
                return player;
            }
        }
        return null;
    }
}
