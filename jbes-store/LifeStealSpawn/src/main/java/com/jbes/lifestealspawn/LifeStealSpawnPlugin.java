package com.jbes.lifestealspawn;

import com.jbes.lifestealspawn.command.GenerateSpawnCommand;
import com.jbes.lifestealspawn.generation.SpawnGenerator;
import com.jbes.lifestealspawn.listener.ProtectionListener;
import com.jbes.lifestealspawn.manager.TemporaryBlockManager;
import org.bukkit.command.PluginCommand;
import org.bukkit.plugin.java.JavaPlugin;

public final class LifeStealSpawnPlugin extends JavaPlugin {
    private TemporaryBlockManager temporaryBlockManager;
    private SpawnGenerator spawnGenerator;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        temporaryBlockManager = new TemporaryBlockManager(this);
        spawnGenerator = new SpawnGenerator(this);

        getServer().getPluginManager().registerEvents(new ProtectionListener(this, temporaryBlockManager), this);

        GenerateSpawnCommand command = new GenerateSpawnCommand(this, spawnGenerator);
        PluginCommand pluginCommand = getCommand("generatespawn");
        if (pluginCommand != null) {
            pluginCommand.setExecutor(command);
            pluginCommand.setTabCompleter(command);
        }
    }

    @Override
    public void onDisable() {
        if (temporaryBlockManager != null) {
            temporaryBlockManager.cancelAll();
        }
        if (spawnGenerator != null) {
            spawnGenerator.cancel();
        }
    }
}
