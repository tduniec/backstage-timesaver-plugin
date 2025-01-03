export interface Config {
  /**
   * @visibility frontend
   */
  ts?: {
    /**
     * @visibility frontend
     */
    frontend?: {
      /**
       * @visibility frontend
       */
      table?: {
        /**
         * @visibility frontend
         */
        showInDays?: boolean;
        /**
         * @visibility frontend
         */
        hoursPerDay?: number;
      };
    };
  };
}
