package com.jbes.lifestealspawn.manager;

import java.util.HashSet;
import java.util.Set;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitTask;

public final class TemporaryBlockManager {
    private final Plugin plugin;
    private final Set<String> temporaryBlocks = new HashSet<>();
    private final Set<BukkitTask> tasks = new HashSet<>();

    public TemporaryBlockManager(Plugin plugin) {
        this.plugin = plugin;
    }

    public void track(Block block, int delaySeconds) {
        String key = key(block.getLocation());
        temporaryBlocks.add(key);
        BukkitTask task = plugin.getServer().getScheduler().runTaskLater(plugin, () -> {
            temporaryBlocks.remove(key);
            if (block.getType() != Material.AIR) {
                block.setType(Material.AIR, false);
            }
        }, Math.max(1L, delaySeconds) * 20L);
        tasks.add(task);
    }

    public boolean isTemporary(Block block) {
        return temporaryBlocks.contains(key(block.getLocation()));
    }

    public void untrack(Block block) {
        temporaryBlocks.remove(key(block.getLocation()));
    }

    public void cancelAll() {
        for (BukkitTask task : tasks) {
            task.cancel();
        }
        tasks.clear();
        temporaryBlocks.clear();
    }

    private String key(Location location) {
        return location.getWorld().getUID() + ":" + location.getBlockX() + ":" + location.getBlockY() + ":" + location.getBlockZ();
    }
}
