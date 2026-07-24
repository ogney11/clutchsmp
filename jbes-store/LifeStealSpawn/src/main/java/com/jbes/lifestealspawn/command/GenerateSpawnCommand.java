package com.jbes.lifestealspawn.command;

import com.jbes.lifestealspawn.generation.SpawnGenerator;
import com.jbes.lifestealspawn.util.TextUtils;
import java.util.List;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

public final class GenerateSpawnCommand implements CommandExecutor, TabCompleter {
    private final Plugin plugin;
    private final SpawnGenerator generator;

    public GenerateSpawnCommand(Plugin plugin, SpawnGenerator generator) {
        this.plugin = plugin;
        this.generator = generator;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!sender.hasPermission("lifestealspawn.generate")) {
            TextUtils.send(sender, "&cYou do not have permission to generate the spawn.");
            return true;
        }
        if (!(sender instanceof Player player)) {
            TextUtils.send(sender, "&cRun this command in-game so the plugin knows which world to build in.");
            return true;
        }
        if (generator.isRunning()) {
            TextUtils.send(sender, "&cSpawn generation is already running.");
            return true;
        }

        boolean clear = plugin.getConfig().getBoolean("clear-area-before-generation", false);
        boolean confirmed = args.length > 0 && args[0].equalsIgnoreCase("confirm");
        if (clear && !confirmed) {
            int spawnSize = plugin.getConfig().getInt("spawn-size", 100);
            int bufferSize = plugin.getConfig().getInt("buffer-size", 200);
            int preparedSize = spawnSize + (bufferSize * 2);
            TextUtils.send(sender, "&eThis will clear blocks in the prepared " + preparedSize + "x" + preparedSize + " area. Run &c/generatespawn confirm &eto continue.");
            return true;
        }

        generator.generate(player.getWorld(), sender, confirmed);
        return true;
    }

    @Override
    public @Nullable List<String> onTabComplete(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (args.length == 1 && sender.hasPermission("lifestealspawn.generate")) {
            return List.of("confirm");
        }
        return List.of();
    }
}
