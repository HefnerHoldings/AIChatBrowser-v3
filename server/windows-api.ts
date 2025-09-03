import { platform } from 'os';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import notifier from 'node-notifier';

const execAsync = promisify(exec);
const isWindows = platform() === 'win32';

// Windows Registry integration (works on Windows only)
let Registry: any = null;
if (isWindows) {
  try {
    Registry = (await import('winreg')).default;
  } catch (e) {
    console.log('Windows Registry not available on this platform');
  }
}

// Windows shortcuts (works on Windows only)
let windowsShortcuts: any = null;
if (isWindows) {
  try {
    windowsShortcuts = await import('windows-shortcuts');
  } catch (e) {
    console.log('Windows shortcuts not available on this platform');
  }
}

export class WindowsAPIService {
  // System Information
  async getSystemInfo() {
    try {
      const info: any = {
        platform: platform(),
        isWindows,
        hostname: (await import('os')).hostname(),
        username: (await import('os')).userInfo().username,
        homedir: (await import('os')).homedir(),
        tempdir: (await import('os')).tmpdir(),
        arch: (await import('os')).arch(),
        release: (await import('os')).release(),
        cpus: (await import('os')).cpus().length,
        totalMemory: Math.round((await import('os')).totalmem() / 1024 / 1024 / 1024) + ' GB',
        freeMemory: Math.round((await import('os')).freemem() / 1024 / 1024 / 1024) + ' GB'
      };

      if (isWindows) {
        // Get Windows-specific info
        try {
          const { stdout: version } = await execAsync('ver');
          info.windowsVersion = version.trim();
        } catch (e) {}
        
        try {
          const { stdout: systemInfo } = await execAsync('systeminfo | findstr /B /C:"OS Name" /C:"OS Version"');
          info.detailedOS = systemInfo.trim();
        } catch (e) {}
      }

      return info;
    } catch (error: any) {
      throw new Error(`Failed to get system info: ${error.message}`);
    }
  }

  // Notifications
  async showNotification(options: {
    title: string;
    message: string;
    icon?: string;
    sound?: boolean;
    wait?: boolean;
  }) {
    return new Promise((resolve, reject) => {
      notifier.notify(
        {
          title: options.title,
          message: options.message,
          icon: options.icon || path.join(__dirname, 'icon.png'),
          sound: options.sound !== false,
          wait: options.wait || false
        },
        (err, response) => {
          if (err) reject(err);
          else resolve(response);
        }
      );
    });
  }

  // Clipboard operations
  async getClipboard(): Promise<string> {
    try {
      if (isWindows) {
        const { stdout } = await execAsync('powershell -command "Get-Clipboard"');
        return stdout.trim();
      } else {
        // Linux/Mac fallback
        const { stdout } = await execAsync('xclip -selection clipboard -o 2>/dev/null || pbpaste 2>/dev/null');
        return stdout.trim();
      }
    } catch (error: any) {
      throw new Error(`Failed to get clipboard: ${error.message}`);
    }
  }

  async setClipboard(text: string): Promise<void> {
    try {
      if (isWindows) {
        await execAsync(`echo ${text} | clip`);
      } else {
        // Linux/Mac fallback
        await execAsync(`echo "${text}" | xclip -selection clipboard 2>/dev/null || pbcopy 2>/dev/null`);
      }
    } catch (error: any) {
      throw new Error(`Failed to set clipboard: ${error.message}`);
    }
  }

  // Screenshot
  async takeScreenshot(outputPath?: string): Promise<string> {
    const screenshotPath = outputPath || path.join((await import('os')).tmpdir(), `screenshot-${Date.now()}.png`);
    
    try {
      if (isWindows) {
        // Use PowerShell to take screenshot on Windows
        const psScript = `
          Add-Type -AssemblyName System.Windows.Forms
          Add-Type -AssemblyName System.Drawing
          $screen = [System.Windows.Forms.SystemInformation]::VirtualScreen
          $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          $graphics.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $bitmap.Size)
          $bitmap.Save('${screenshotPath}')
          $graphics.Dispose()
          $bitmap.Dispose()
        `;
        await execAsync(`powershell -command "${psScript.replace(/\n/g, ' ')}"`);
      } else {
        // Linux/Mac fallback (requires ImageMagick or scrot)
        await execAsync(`import -window root "${screenshotPath}" 2>/dev/null || scrot "${screenshotPath}" 2>/dev/null`);
      }
      
      return screenshotPath;
    } catch (error: any) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }

  // Registry operations (Windows only)
  async readRegistry(keyPath: string, valueName: string): Promise<any> {
    if (!isWindows || !Registry) {
      throw new Error('Registry operations only available on Windows');
    }

    return new Promise((resolve, reject) => {
      const regKey = new Registry({
        hive: Registry.HKCU,
        key: keyPath
      });

      regKey.get(valueName, (err: any, item: any) => {
        if (err) reject(err);
        else resolve(item ? item.value : null);
      });
    });
  }

  async writeRegistry(keyPath: string, valueName: string, value: string, type?: string): Promise<void> {
    if (!isWindows || !Registry) {
      throw new Error('Registry operations only available on Windows');
    }

    return new Promise((resolve, reject) => {
      const regKey = new Registry({
        hive: Registry.HKCU,
        key: keyPath
      });

      regKey.set(valueName, type || Registry.REG_SZ, value, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // File associations
  async getFileAssociation(extension: string): Promise<string | null> {
    if (!isWindows) {
      throw new Error('File associations only available on Windows');
    }

    try {
      const { stdout } = await execAsync(`assoc ${extension}`);
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  async setFileAssociation(extension: string, program: string): Promise<void> {
    if (!isWindows) {
      throw new Error('File associations only available on Windows');
    }

    try {
      await execAsync(`assoc ${extension}=${program}`, { shell: true });
    } catch (error: any) {
      throw new Error(`Failed to set file association: ${error.message}`);
    }
  }

  // Create desktop shortcut
  async createShortcut(options: {
    target: string;
    shortcutPath: string;
    description?: string;
    icon?: string;
    args?: string;
    workingDir?: string;
  }): Promise<void> {
    if (!isWindows || !windowsShortcuts) {
      throw new Error('Shortcuts only available on Windows');
    }

    return new Promise((resolve, reject) => {
      windowsShortcuts.create(options.shortcutPath, {
        target: options.target,
        desc: options.description,
        icon: options.icon,
        args: options.args,
        workingDir: options.workingDir
      }, (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Open file/folder with default application
  async openFile(filePath: string): Promise<void> {
    try {
      const command = isWindows 
        ? `start "" "${filePath}"`
        : process.platform === 'darwin'
          ? `open "${filePath}"`
          : `xdg-open "${filePath}"`;
      
      await execAsync(command);
    } catch (error: any) {
      throw new Error(`Failed to open file: ${error.message}`);
    }
  }

  // Get running processes
  async getProcesses(): Promise<any[]> {
    try {
      if (isWindows) {
        const { stdout } = await execAsync('wmic process get Name,ProcessId,WorkingSetSize /format:csv');
        const lines = stdout.trim().split('\n').slice(2);
        return lines.map(line => {
          const [, name, pid, memory] = line.split(',');
          return { name, pid: parseInt(pid), memory: parseInt(memory) };
        });
      } else {
        const { stdout } = await execAsync('ps aux');
        const lines = stdout.trim().split('\n').slice(1);
        return lines.map(line => {
          const parts = line.split(/\s+/);
          return {
            user: parts[0],
            pid: parseInt(parts[1]),
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]),
            command: parts.slice(10).join(' ')
          };
        });
      }
    } catch (error: any) {
      throw new Error(`Failed to get processes: ${error.message}`);
    }
  }

  // Kill process
  async killProcess(pid: number): Promise<void> {
    try {
      if (isWindows) {
        await execAsync(`taskkill /PID ${pid} /F`);
      } else {
        await execAsync(`kill -9 ${pid}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to kill process: ${error.message}`);
    }
  }

  // Get installed programs (Windows only)
  async getInstalledPrograms(): Promise<any[]> {
    if (!isWindows) {
      throw new Error('Installed programs list only available on Windows');
    }

    try {
      const { stdout } = await execAsync(
        'wmic product get Name,Version,Vendor,InstallDate /format:csv'
      );
      const lines = stdout.trim().split('\n').slice(2);
      return lines.map(line => {
        const [, installDate, name, vendor, version] = line.split(',');
        return { name, version, vendor, installDate };
      });
    } catch (error: any) {
      throw new Error(`Failed to get installed programs: ${error.message}`);
    }
  }

  // Windows user authentication info
  async getUserAuthInfo(): Promise<any> {
    if (!isWindows) {
      throw new Error('Windows authentication only available on Windows');
    }

    try {
      const info: any = {};
      
      // Get current user
      const { stdout: username } = await execAsync('echo %USERNAME%');
      info.username = username.trim();
      
      // Get domain
      const { stdout: domain } = await execAsync('echo %USERDOMAIN%');
      info.domain = domain.trim();
      
      // Get user groups
      const { stdout: groups } = await execAsync('whoami /groups /fo csv | findstr /v "^Group Name"');
      info.groups = groups.trim().split('\n').map(line => {
        const parts = line.split(',');
        return parts[0]?.replace(/"/g, '');
      }).filter(Boolean);
      
      // Get privileges
      const { stdout: privs } = await execAsync('whoami /priv /fo csv | findstr /v "^Privilege Name"');
      info.privileges = privs.trim().split('\n').map(line => {
        const parts = line.split(',');
        return {
          name: parts[0]?.replace(/"/g, ''),
          state: parts[2]?.replace(/"/g, '')
        };
      }).filter(p => p.name);
      
      return info;
    } catch (error: any) {
      throw new Error(`Failed to get user auth info: ${error.message}`);
    }
  }

  // File system watcher
  async watchDirectory(dirPath: string, callback: (event: string, filename: string) => void): Promise<() => void> {
    const { watch } = await import('fs');
    const watcher = watch(dirPath, { recursive: true }, (eventType, filename) => {
      if (filename) {
        callback(eventType as string, filename);
      }
    });
    
    return () => watcher.close();
  }

  // Execute PowerShell command
  async executePowerShell(command: string): Promise<string> {
    if (!isWindows) {
      throw new Error('PowerShell only available on Windows');
    }

    try {
      const { stdout } = await execAsync(`powershell -command "${command}"`);
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`PowerShell execution failed: ${error.message}`);
    }
  }

  // Network shares
  async getNetworkShares(): Promise<any[]> {
    if (!isWindows) {
      throw new Error('Network shares only available on Windows');
    }

    try {
      const { stdout } = await execAsync('net share');
      const lines = stdout.trim().split('\n').slice(3);
      return lines
        .filter(line => line.trim() && !line.includes('The command completed'))
        .map(line => {
          const parts = line.split(/\s{2,}/);
          return {
            name: parts[0],
            resource: parts[1],
            remark: parts[2]
          };
        });
    } catch (error: any) {
      throw new Error(`Failed to get network shares: ${error.message}`);
    }
  }
}

export const windowsAPI = new WindowsAPIService();