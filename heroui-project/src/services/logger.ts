/**
 * Servicio de registro (logger) para la aplicación
 * Proporciona funciones para registrar mensajes de diferentes niveles
 * y configurar el comportamiento del registro según el entorno
 */

// Niveles de registro disponibles
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4, // Desactiva todos los registros
}

// Configuración del logger
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  includeTimestamp: boolean;
  prefix?: string;
}

// Clase principal del logger
class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  
  // Colores para la consola
  private readonly COLORS = {
    debug: '#7f8c8d', // gris
    info: '#2ecc71',  // verde
    warn: '#f39c12',  // naranja
    error: '#e74c3c', // rojo
  };

  private constructor() {
    // Configuración por defecto
    this.config = {
      level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production',
      includeTimestamp: true,
      prefix: 'HeroUI',
    };
  }

  /**
   * Obtiene la instancia única del logger (patrón Singleton)
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Configura el logger
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Registra un mensaje de nivel DEBUG
   */
  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args, this.COLORS.debug);
  }

  /**
   * Registra un mensaje de nivel INFO
   */
  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args, this.COLORS.info);
  }

  /**
   * Registra un mensaje de nivel WARN
   */
  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, args, this.COLORS.warn);
  }

  /**
   * Registra un mensaje de nivel ERROR
   */
  public error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, args, this.COLORS.error);
  }

  /**
   * Método interno para procesar y mostrar los registros
   */
  private log(level: LogLevel, message: string, args: any[], color: string): void {
    // Verificar si el nivel de registro está habilitado
    if (level < this.config.level) {
      return;
    }

    // Construir el mensaje completo
    let formattedMessage = '';
    
    // Añadir timestamp si está configurado
    if (this.config.includeTimestamp) {
      formattedMessage += `[${new Date().toISOString()}] `;
    }
    
    // Añadir prefijo si está configurado
    if (this.config.prefix) {
      formattedMessage += `[${this.config.prefix}] `;
    }
    
    // Añadir nivel de registro
    formattedMessage += `[${LogLevel[level]}] `;
    
    // Añadir mensaje principal
    formattedMessage += message;

    // Registrar en consola si está habilitado
    if (this.config.enableConsole) {
      const consoleMethod = this.getConsoleMethod(level);
      if (args.length > 0) {
        console[consoleMethod](`%c${formattedMessage}`, `color: ${color}`, ...args);
      } else {
        console[consoleMethod](`%c${formattedMessage}`, `color: ${color}`);
      }
    }

    // Enviar a endpoint remoto si está habilitado
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemoteEndpoint(level, formattedMessage, args);
    }
  }

  /**
   * Obtiene el método de consola correspondiente al nivel de registro
   */
  private getConsoleMethod(level: LogLevel): 'debug' | 'info' | 'warn' | 'error' {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Envía el registro a un endpoint remoto (para análisis o monitoreo)
   */
  private sendToRemoteEndpoint(level: LogLevel, message: string, args: any[]): void {
    // Implementación básica, se puede mejorar según necesidades
    if (!this.config.remoteEndpoint) return;
    
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        level: LogLevel[level],
        message,
        data: args.length > 0 ? args : undefined,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Enviar de forma asíncrona para no bloquear
      navigator.sendBeacon(this.config.remoteEndpoint, JSON.stringify(logData));
    } catch (error) {
      // Fallar silenciosamente para no interrumpir la aplicación
      console.error('Error al enviar log remoto:', error);
    }
  }
}

// Exportar una instancia única del logger
const logger = Logger.getInstance();
export default logger;