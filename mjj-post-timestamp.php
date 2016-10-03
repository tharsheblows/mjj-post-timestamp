<?php

/**
 * Plugin Name: MJJ Post Timestamp
 * Version: 0.1-alpha
 * Description: Add an editable Unix timestamp to the date field on posts while keeping the site time.
 * Author: JJ Jay
 */

	
class MJJ_Post_Timestamp{

	public static function init(){

		$self = new self();
		add_action( 'admin_enqueue_scripts', array( $self, 'enqueue_scripts' ) );
	}

	public static function enqueue_scripts(){

		$screen = get_current_screen();

		if( 'post' === $screen->base && ('add' === $screen->action || 'edit' === $_GET['action'] ) ){

			// this offset will be used to keep the correct site time in the published box
			$gmt_offset =  array(
				'gmt_offset' => (int)get_option( 'gmt_offset' )
			);

			wp_enqueue_script( 'mjj_post_timestamp', plugin_dir_url( __FILE__ ) . 'js/mjj-post-timestamp.js', array( 'jquery' ) );
			wp_localize_script( 'mjj_post_timestamp', 'MJJPostTimestamp', $gmt_offset );
		}
	}

}

add_action( 'plugins_loaded', array( 'MJJ_Post_Timestamp', 'init' ) );