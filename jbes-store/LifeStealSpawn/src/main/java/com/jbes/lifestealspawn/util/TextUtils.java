package com.jbes.lifestealspawn.util;

import org.bukkit.ChatColor;
import org.bukkit.command.CommandSender;

public final class TextUtils {
    private static final String PREFIX = ChatColor.DARK_RED + "[" + ChatColor.RED + "LifeStealSpawn" + ChatColor.DARK_RED + "] " + ChatColor.GRAY;

    private TextUtils() {
    }

    public static void send(CommandSender sender, String message) {
        sender.sendMessage(PREFIX + ChatColor.translateAlternateColorCodes('&', message));
    }
}
