package DigitalClock;

public class ClockDemo {
    public static void main(String[] args)
  {
    ClockDisplay clock = new ClockDisplay();
    clock.setTime(1, 10, 1);  // set time to 20:10

    while(true) {
      clock.minIncrement();
      //System.out.println(" tick...");
      System.out.println("Current time: " + clock.getTime());

      wait(1000);   // slow down the looping
    }

}// end of main()

private static void wait(int milliseconds)
  /* stop execution for milliseconds  amount of time */
  {
    try {
      Thread.sleep(milliseconds);
    } 
    catch (Exception e) { }
  }  // end of wait()


}// end of ClockDemo class

